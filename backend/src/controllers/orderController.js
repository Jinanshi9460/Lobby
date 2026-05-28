const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const Vendor = require('../models/Vendor');
const { ApiError } = require('../middlewares/errorHandler');

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

    const order = await Order.create({
      user: req.user._id,
      vendor: firstProduct.vendor?._id,
      shop: firstProduct.shop?._id,
      items: normalizedItems,
      subtotal,
      total,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'paid' : 'pending',
      tracking: [{ status: 'pending', updatedAt: new Date(), note: 'Order received' }]
    });

    if (paymentMethod === 'razorpay') {
      const razorpayClient = getRazorpayClient();
      if (!razorpayClient) throw new ApiError('Razorpay keys are not configured', 500);
      const razorpayOrder = await razorpayClient.orders.create({ amount: total * 100, currency: 'INR', receipt: order._id.toString() });
      await Payment.create({ order: order._id, razorpayOrderId: razorpayOrder.id, amount: total });
      return res.status(201).json({ success: true, order, razorpayOrder });
    }

    await Notification.create({ user: req.user._id, title: 'Order placed', message: `Order ${order._id} created successfully.`, type: 'order' });
    res.status(201).json({ success: true, order });
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
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    await order.save();
    await Notification.create({ user: req.user._id, title: 'Payment successful', message: `Your payment for order ${order._id} is confirmed.`, type: 'order' });
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    let query = { user: req.user._id };
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      query = { vendor: vendor?._id };
    }
    const orders = await Order.find(query).sort({ createdAt: -1 }).populate('items.product');
    res.json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) throw new ApiError('Order not found', 404);
    if (req.user.role === 'student' && order.user.toString() !== req.user._id.toString()) {
      throw new ApiError('Unauthorized', 403);
    }
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError('Order not found', 404);
    order.status = req.body.status || order.status;
    order.tracking.push({ status: order.status, updatedAt: new Date(), note: req.body.note || 'Status updated' });
    await order.save();
    await Notification.create({ user: order.user, title: 'Order update', message: `Your order ${order._id} is now ${order.status}.`, type: 'order' });
    res.json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus, verifyPayment };
