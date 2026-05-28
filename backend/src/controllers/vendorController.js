const Vendor = require('../models/Vendor');
const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const { ApiError } = require('../middlewares/errorHandler');

const ensureApprovedVendor = async userId => {
  const vendor = await Vendor.findOne({ user: userId });
  if (!vendor) throw new ApiError('Vendor not found', 404);
  if (!vendor.isApproved) {
    throw new ApiError('Admin approval pending. Vendor actions are disabled until approval.', 403);
  }
  return vendor;
};

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

const registerVendor = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError('User not found', 404);
    const existingVendor = await Vendor.findOne({ user: user._id });
    if (existingVendor) throw new ApiError('Vendor account already exists', 409);
    const vendor = await Vendor.create({ user: user._id, ...req.body });
    user.role = 'vendor';
    await user.save();
    res.status(201).json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
};

const getVendorProfile = async (req, res, next) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id }).populate('user', 'name email phone');
    if (!vendor) throw new ApiError('Vendor profile not found', 404);
    res.json({ success: true, vendor });
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
    res.json({ success: true, vendor });
  } catch (error) {
    next(error);
  }
};

const vendorSales = async (req, res, next) => {
  try {
    const vendor = await ensureApprovedVendor(req.user._id);
    res.json({ success: true, revenue: vendor.revenue, totalOrders: vendor.totalOrders, inventoryValue: vendor.inventoryValue });
  } catch (error) {
    next(error);
  }
};

const getVendorProducts = async (req, res, next) => {
  try {
    const vendor = await ensureApprovedVendor(req.user._id);
    const products = await Product.find({ vendor: vendor._id, isActive: true }).populate('category', 'title').sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

const createVendorProduct = async (req, res, next) => {
  try {
    const vendor = await ensureApprovedVendor(req.user._id);

    const category = await Category.findById(req.body.category);
    if (!category) throw new ApiError('Invalid category', 400);

    const shop = await Shop.findOne({ vendor: vendor._id });
    const product = await Product.create({
      ...req.body,
      vendor: vendor._id,
      shop: req.body.shop || shop?._id,
      images: req.body.images?.length ? req.body.images : ['https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80'],
      isActive: true
    });
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const deleteVendorProduct = async (req, res, next) => {
  try {
    const vendor = await ensureApprovedVendor(req.user._id);
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendor: vendor._id },
      { isActive: false },
      { new: true }
    );
    if (!product) throw new ApiError('Product not found', 404);
    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    next(error);
  }
};

const updateVendorSettings = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const vendor = await ensureApprovedVendor(req.user._id);

    if (phone) {
      vendor.contactNumber = phone;
      await vendor.save();
      await User.findByIdAndUpdate(req.user._id, { phone });
      await Shop.updateMany({ vendor: vendor._id }, { contactNumber: phone });
    }

    const updatedVendor = await Vendor.findById(vendor._id).populate('user', 'name email phone');
    res.json({ success: true, vendor: updatedVendor });
  } catch (error) {
    next(error);
  }
};

const exportVendorCsv = async (req, res, next) => {
  try {
    const vendor = await ensureApprovedVendor(req.user._id);
    const dateFilter = parseDateRange(req.query);
    const orderFilter = { vendor: vendor._id, ...dateFilter };
    const productFilter = { vendor: vendor._id };

    const [orders, products, shops] = await Promise.all([
      Order.find(orderFilter).sort({ createdAt: -1 }).limit(100),
      Product.find(productFilter).sort({ createdAt: -1 }).limit(100),
      Shop.find({ vendor: vendor._id })
    ]);

    const paidRevenue = orders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const rows = [
      ['LOBBy Vendor CSV Export'],
      ['Generated At', new Date().toISOString()],
      ['Store Name', vendor.storeName],
      ['From', req.query.from || 'N/A'],
      ['To', req.query.to || 'N/A'],
      [],
      ['Dashboard Metrics'],
      ['Orders In Range', orders.length],
      ['Paid Revenue In Range', paidRevenue],
      ['Active Products', products.filter(p => p.isActive).length],
      ['Total Products', products.length],
      ['Total Shops', shops.length],
      [],
      ['Orders In Range'],
      ['Order ID', 'Created At', 'Status', 'Payment Status', 'Total']
    ];

    orders.forEach(order => {
      rows.push([
        order._id.toString(),
        order.createdAt?.toISOString() || '',
        order.status || '',
        order.paymentStatus || '',
        order.total || 0
      ]);
    });

    rows.push([], ['Products Snapshot'], ['Product ID', 'Title', 'Price', 'Stock', 'Active']);
    products.forEach(product => {
      rows.push([
        product._id.toString(),
        product.title,
        product.price || 0,
        product.stock || 0,
        product.isActive ? 'Yes' : 'No'
      ]);
    });

    const csvContent = rows.map(row => row.map(csvCell).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=vendor-report-${Date.now()}.csv`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerVendor,
  getVendorProfile,
  approveVendor,
  vendorSales,
  exportVendorCsv,
  getVendorProducts,
  createVendorProduct,
  deleteVendorProduct,
  updateVendorSettings
};
