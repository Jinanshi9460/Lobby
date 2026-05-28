const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');

const getAnalytics = async (req, res, next) => {
  try {
    const period = req.query.period || '30d';
    const date = new Date();
    date.setDate(date.getDate() - 30);
    const pipeline = [
      { $match: { createdAt: { $gte: date }, paymentStatus: 'paid' } },
      { $group: { _id: '$status', total: { $sum: '$total' }, count: { $sum: 1 } } }
    ];
    const orderStats = await Order.aggregate(pipeline);
    const topProducts = await Product.find().sort({ rating: -1 }).limit(5).select('title price rating');
    let vendorSummary = null;
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id }).select('revenue totalOrders inventoryValue isApproved');
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor not found' });
      }
      if (!vendor.isApproved) {
        return res.status(403).json({
          success: false,
          message: 'Admin approval pending. Vendor analytics will be available after approval.'
        });
      }
      vendorSummary = vendor;
    }
    res.json({ success: true, analytics: { orderStats, topProducts, vendorSummary } });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
