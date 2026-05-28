const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Notification = require('../models/Notification');
const { ApiError } = require('../middlewares/errorHandler');
const { sendEmail } = require('../utils/mailer');

const parseDateRange = query => {
  const filter = {};
  const { from, to } = query;
  if (from || to) {
    filter.createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) filter.createdAt.$gte = fromDate;
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = toDate;
      }
    }
    if (!Object.keys(filter.createdAt).length) delete filter.createdAt;
  }
  return filter;
};

const csvCell = value => {
  const stringValue = value === undefined || value === null ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const toCsv = rows => rows.map(row => row.map(csvCell).join(',')).join('\n');

const notifyVendor = async (vendorId, subject, message) => {
  const vendor = await Vendor.findById(vendorId).populate('user', 'email name');
  if (!vendor?.user) return;
  await Notification.create({
    user: vendor.user._id,
    title: subject,
    message,
    type: 'alert'
  }).catch(() => {});
  await sendEmail({
    to: vendor.user.email,
    subject: `LOBBy: ${subject}`,
    text: `Hello ${vendor.user.name || 'Vendor'},\n\n${message}\n\n- LOBBy Admin`
  }).catch(() => {});
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [students, vendors, orders, products, shops] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Vendor.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments(),
      Shop.countDocuments()
    ]);
    const revenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]);
    const pendingVendors = await Vendor.countDocuments({ isApproved: false });
    const activeProducts = await Product.countDocuments({ isActive: true });
    const openShops = await Shop.countDocuments({ isOpen: true });
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5).select('status total createdAt');

    const topVendors = await Vendor.find()
      .sort({ revenue: -1 })
      .limit(5)
      .select('storeName revenue totalOrders rating isApproved');

    const categoryBreakdown = await Product.aggregate([
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: '$categoryInfo' },
      { $group: { _id: '$categoryInfo.title', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      stats: {
        students,
        vendors,
        orders,
        products,
        shops,
        activeProducts,
        openShops,
        pendingVendors,
        revenue: revenue[0]?.total || 0
      },
      recentOrders,
      topVendors,
      categoryBreakdown
    });
  } catch (error) {
    next(error);
  }
};

const listUsers = async (req, res, next) => {
  try {
    const users = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

const listVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find().populate('user', 'name email phone');
    res.json({ success: true, vendors });
  } catch (error) {
    next(error);
  }
};

const approveVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) throw new ApiError('Vendor not found', 404);
    vendor.isApproved = true;
    await vendor.save();
    await notifyVendor(vendor._id, 'Vendor account approved', 'Your vendor account has been approved by admin. You can now log in and manage your store.');
    res.json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
};

const rejectVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) throw new ApiError('Vendor not found', 404);
    vendor.isApproved = false;
    await vendor.save();
    await notifyVendor(vendor._id, 'Vendor approval pending', 'Your vendor account is currently marked as pending by admin. Please contact support if needed.');
    res.json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
};

const removeVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) throw new ApiError('Vendor not found', 404);
    await notifyVendor(vendor._id, 'Vendor access removed', 'Your vendor access has been removed by admin. Your store is no longer active.');

    await Shop.deleteMany({ vendor: vendor._id });
    await Product.updateMany({ vendor: vendor._id }, { isActive: false, shop: null });
    await User.findByIdAndUpdate(vendor.user, { role: 'student' });
    await Vendor.findByIdAndDelete(vendor._id);

    res.json({ success: true, message: 'Vendor removed successfully' });
  } catch (error) {
    next(error);
  }
};

const suspendUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError('User not found', 404);
    user.isSuspended = true;
    await user.save();
    res.json({ success: true, message: 'User suspended' });
  } catch (error) {
    next(error);
  }
};

const listShops = async (req, res, next) => {
  try {
    const shops = await Shop.find()
      .populate({ path: 'vendor', select: 'storeName isApproved', populate: { path: 'user', select: 'email' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, shops });
  } catch (error) {
    next(error);
  }
};

const toggleShopStatus = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) throw new ApiError('Shop not found', 404);
    shop.isOpen = !shop.isOpen;
    await shop.save();
    await notifyVendor(
      shop.vendor,
      `Shop ${shop.isOpen ? 'opened' : 'closed'} by admin`,
      `Admin has ${shop.isOpen ? 'opened' : 'closed'} your shop "${shop.name}". Customers will see the latest availability state now.`
    );
    res.json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

const listProducts = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('category', 'title')
      .populate('shop', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

const toggleProductStatus = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) throw new ApiError('Product not found', 404);
    product.isActive = !product.isActive;
    await product.save();
    await notifyVendor(
      product.vendor,
      `Product ${product.isActive ? 'activated' : 'deactivated'} by admin`,
      `Admin has ${product.isActive ? 'activated' : 'deactivated'} your product "${product.title}".`
    );
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const exportAdminCsv = async (req, res, next) => {
  try {
    const dateFilter = parseDateRange(req.query);
    const [students, vendors, shops, products, ordersInRange] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      Vendor.countDocuments(),
      Shop.countDocuments(),
      Product.countDocuments(),
      Order.find(dateFilter).sort({ createdAt: -1 }).populate('vendor', 'storeName').limit(100)
    ]);

    const revenueInRange = ordersInRange
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const rows = [
      ['LOBBy Admin CSV Export'],
      ['Generated At', new Date().toISOString()],
      ['From', req.query.from || 'N/A'],
      ['To', req.query.to || 'N/A'],
      [],
      ['Overall Metrics'],
      ['Students', students],
      ['Vendors', vendors],
      ['Shops', shops],
      ['Products', products],
      ['Orders In Range', ordersInRange.length],
      ['Revenue In Range', revenueInRange],
      [],
      ['Recent Orders In Range'],
      ['Order ID', 'Created At', 'Status', 'Payment Status', 'Total', 'Vendor']
    ];

    ordersInRange.forEach(order => {
      rows.push([
        order._id.toString(),
        order.createdAt?.toISOString() || '',
        order.status || '',
        order.paymentStatus || '',
        order.total || 0,
        order.vendor?.storeName || ''
      ]);
    });

    const csvContent = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=admin-report-${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  listUsers,
  listVendors,
  approveVendor,
  rejectVendor,
  removeVendor,
  suspendUser,
  listShops,
  toggleShopStatus,
  listProducts,
  toggleProductStatus,
  exportAdminCsv
};
