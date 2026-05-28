const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Vendor = require('../models/Vendor');
const DeliveryPartner = require('../models/DeliveryPartner');
const { ApiError } = require('../middlewares/errorHandler');
const {
  generateDeliveryOtp,
  hashDeliveryOtp,
  verifyDeliveryOtp,
  assertTransition,
  appendTracking,
  sanitizeOrder,
  sanitizeOrders,
  ensureCustomerDeliveryOtp
} = require('../utils/orderHelpers');

const OTP_MAX_ATTEMPTS = 5;
const OTP_TTL_MS = 24 * 60 * 60 * 1000;

let razorpay = null;
const getRazorpayClient = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  if (!keyId || !keySecret) return null;

  if (!razorpay) {
    razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
  }
  return razorpay;
};

const getVendorForUser = async userId => Vendor.findOne({ user: userId });

const getDeliveryPartnerForUser = async userId => DeliveryPartner.findOne({ user: userId, isActive: true });

const assertVendorOwnsOrder = async (userId, order) => {
  const vendor = await getVendorForUser(userId);
  if (!vendor || order.vendor.toString() !== vendor._id.toString()) {
    throw new ApiError('Unauthorized vendor access to this order', 403);
  }
  return vendor;
};

const notifyStudent = async (order, title, message) => {
  await Notification.create({
    user: order.user,
    title,
    message,
    type: 'order'
  });
};

const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds }, isActive: true }).populate('vendor shop');
    if (!products.length) throw new ApiError('No valid products found for checkout', 400);

    const productMap = new Map(products.map(product => [product._id.toString(), product]));
    const normalizedItems = items.map(item => {
      const product = productMap.get(item.product.toString());
      if (!product) throw new ApiError('Some products are unavailable', 400);
      if (!product.shop?.isOpen || !product.vendor?.isApproved) {
        throw new ApiError(`${product.title} is unavailable at this moment`, 400);
      }
      return {
        product: product._id,
        quantity: Number(item.quantity) || 1,
        price: product.price
      };
    });

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal;
    const firstProduct = products[0];
    const isCod = paymentMethod === 'cod';

    const order = await Order.create({
      user: req.user._id,
      vendor: firstProduct.vendor?._id,
      shop: firstProduct.shop?._id,
      items: normalizedItems,
      subtotal,
      total,
      shippingAddress,
      paymentMethod,
      paymentStatus: isCod ? 'paid' : 'pending',
      status: isCod ? 'confirmed' : 'pending',
      tracking: [
        {
          status: isCod ? 'confirmed' : 'pending',
          updatedAt: new Date(),
          note: isCod ? 'Order placed (COD)' : 'Order received — awaiting payment'
        }
      ]
    });

    if (paymentMethod === 'razorpay') {
      const razorpayClient = getRazorpayClient();
      if (!razorpayClient) throw new ApiError('Razorpay keys are not configured', 500);
      const razorpayOrder = await razorpayClient.orders.create({ amount: total * 100, currency: 'INR', receipt: order._id.toString() });
      await Payment.create({ order: order._id, razorpayOrderId: razorpayOrder.id, amount: total });
      return res.status(201).json({ success: true, order: sanitizeOrder(order), razorpayOrder });
    }

    await notifyStudent(order, 'Order placed', `Order ${order._id} confirmed. The vendor will start preparing it soon.`);
    res.status(201).json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) throw new ApiError('Razorpay configuration missing', 500);
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;
    const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (generatedSignature !== razorpay_signature) throw new ApiError('Payment verification failed', 400);
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) throw new ApiError('Payment record not found', 404);
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.method = 'razorpay';
    payment.status = 'paid';
    await payment.save();
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError('Order not found', 404);
    order.paymentStatus = 'paid';
    assertTransition(order.status, 'confirmed');
    order.status = 'confirmed';
    appendTracking(order, 'confirmed', 'Payment verified');
    await order.save();
    await notifyStudent(order, 'Payment successful', `Your payment for order ${order._id} is confirmed.`);
    res.json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    if (error.statusCode) return next(new ApiError(error.message, error.statusCode));
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    let query = { user: req.user._id };
    const isCustomerOrders = req.user.role !== 'vendor';
    if (req.user.role === 'vendor') {
      const vendor = await getVendorForUser(req.user._id);
      query = { vendor: vendor?._id };
    }
    let orderQuery = Order.find(query).sort({ createdAt: -1 });
    if (isCustomerOrders) {
      orderQuery = orderQuery.select('+customerDeliveryOtp');
    }
    const orders = await orderQuery
      .populate('items.product')
      .populate({ path: 'deliveryPartner', select: 'name phone' });
    if (isCustomerOrders) {
      await Promise.all(
        orders
          .filter(order => order.status === 'dispatched')
          .map(order => ensureCustomerDeliveryOtp(order, OTP_TTL_MS))
      );
    }
    res.json({
      success: true,
      orders: sanitizeOrders(orders, { includeCustomerOtp: isCustomerOrders })
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const isCustomerOwner = req.user.role !== 'vendor' && req.user.role !== 'admin' && req.user.role !== 'delivery';
    let orderQuery = Order.findById(req.params.id);
    if (isCustomerOwner) {
      orderQuery = orderQuery.select('+customerDeliveryOtp');
    }
    const order = await orderQuery
      .populate('items.product')
      .populate({ path: 'deliveryPartner', select: 'name phone' });
    if (!order) throw new ApiError('Order not found', 404);
    if (isCustomerOwner && order.user.toString() !== req.user._id.toString()) {
      throw new ApiError('Unauthorized', 403);
    }
    if (req.user.role === 'vendor') {
      await assertVendorOwnsOrder(req.user._id, order);
    }
    if (isCustomerOwner && order.user.toString() === req.user._id.toString() && order.status === 'dispatched') {
      await ensureCustomerDeliveryOtp(order, OTP_TTL_MS);
    }
    res.json({
      success: true,
      order: sanitizeOrder(order, {
        includeCustomerOtp: isCustomerOwner && order.user.toString() === req.user._id.toString()
      })
    });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (!status) throw new ApiError('Status is required', 400);
    if (status === 'dispatched') {
      throw new ApiError('Use dispatch endpoint with a delivery partner assignment', 400);
    }
    if (status === 'delivered') {
      throw new ApiError('Delivered status requires delivery partner OTP confirmation', 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError('Order not found', 404);

    if (req.user.role === 'vendor') {
      await assertVendorOwnsOrder(req.user._id, order);
      if (!['preparing', 'cancelled'].includes(status)) {
        throw new ApiError('Vendors can only set preparing or cancelled', 403);
      }
    } else if (req.user.role !== 'admin') {
      throw new ApiError('Insufficient permissions', 403);
    }

    assertTransition(order.status, status);
    order.status = status;
    appendTracking(order, status, note || `Order ${status}`);
    await order.save();
    await notifyStudent(order, 'Order update', `Your order ${order._id} is now ${status}.`);
    res.json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    if (error.statusCode) return next(new ApiError(error.message, error.statusCode));
    next(error);
  }
};

const dispatchOrder = async (req, res, next) => {
  try {
    const { deliveryPartnerId } = req.body;
    if (!deliveryPartnerId) throw new ApiError('deliveryPartnerId is required', 400);

    const order = await Order.findById(req.params.id).select('+deliveryOtpHash');
    if (!order) throw new ApiError('Order not found', 404);

    await assertVendorOwnsOrder(req.user._id, order);
    assertTransition(order.status, 'dispatched');

    const partner = await DeliveryPartner.findOne({
      _id: deliveryPartnerId,
      vendor: order.vendor,
      isActive: true
    }).populate('user', '_id name email');

    if (!partner) throw new ApiError('Delivery partner not found or inactive', 404);

    const otp = generateDeliveryOtp();
    order.deliveryOtpHash = await hashDeliveryOtp(otp);
    order.customerDeliveryOtp = otp;
    order.deliveryOtpExpires = new Date(Date.now() + OTP_TTL_MS);
    order.deliveryOtpAttempts = 0;
    order.deliveryPartner = partner._id;
    order.status = 'dispatched';
    appendTracking(order, 'dispatched', `Assigned to ${partner.name}`);
    await order.save();

    if (partner.user) {
      await Notification.create({
        user: partner.user._id,
        title: 'New delivery assignment',
        message: `Order #${order._id.slice(-6)} is assigned to you. Collect the delivery OTP from the customer to confirm.`,
        type: 'order'
      });
    }

    await notifyStudent(
      order,
      'Order out for delivery',
      `Your order #${order._id.slice(-6)} is on the way. Delivery OTP: ${otp}. Share this code with your delivery partner when you receive the order.`
    );

    res.json({
      success: true,
      order: sanitizeOrder(order),
      deliveryPartner: { id: partner._id, name: partner.name, phone: partner.phone }
    });
  } catch (error) {
    if (error.statusCode) return next(new ApiError(error.message, error.statusCode));
    next(error);
  }
};

const confirmDelivery = async (req, res, next) => {
  try {
    const { otp } = req.body;
    if (!otp) throw new ApiError('OTP is required', 400);

    const partner = await getDeliveryPartnerForUser(req.user._id);
    if (!partner) throw new ApiError('Delivery partner profile not found', 404);

    const order = await Order.findById(req.params.id).select('+deliveryOtpHash');
    if (!order) throw new ApiError('Order not found', 404);

    if (!order.deliveryPartner || order.deliveryPartner.toString() !== partner._id.toString()) {
      throw new ApiError('This order is not assigned to you', 403);
    }
    if (order.status !== 'dispatched') {
      throw new ApiError('Order is not awaiting delivery confirmation', 400);
    }
    if (order.deliveryOtpExpires && order.deliveryOtpExpires < new Date()) {
      throw new ApiError('Delivery OTP has expired. Ask the vendor to re-dispatch.', 400);
    }
    if (order.deliveryOtpAttempts >= OTP_MAX_ATTEMPTS) {
      throw new ApiError('Too many failed OTP attempts. Contact the vendor.', 429);
    }

    const isValid = order.deliveryOtpHash && (await verifyDeliveryOtp(String(otp).trim(), order.deliveryOtpHash));
    if (!isValid) {
      order.deliveryOtpAttempts += 1;
      await order.save();
      throw new ApiError('Invalid delivery OTP', 400);
    }

    assertTransition(order.status, 'delivered');
    order.status = 'delivered';
    order.deliveredAt = new Date();
    order.deliveryConfirmedBy = req.user._id;
    order.deliveryOtpHash = undefined;
    order.customerDeliveryOtp = undefined;
    order.deliveryOtpExpires = undefined;
    order.deliveryOtpAttempts = 0;
    appendTracking(order, 'delivered', `Delivered by ${partner.name}`);
    await order.save();

    await notifyStudent(order, 'Order delivered', `Your order ${order._id} has been delivered.`);

    res.json({ success: true, order: sanitizeOrder(order) });
  } catch (error) {
    if (error.statusCode) return next(new ApiError(error.message, error.statusCode));
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  verifyPayment,
  dispatchOrder,
  confirmDelivery
};
