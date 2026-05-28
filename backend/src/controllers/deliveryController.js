const Order = require('../models/Order');
const DeliveryPartner = require('../models/DeliveryPartner');
const { ApiError } = require('../middlewares/errorHandler');
const { sanitizeOrders } = require('../utils/orderHelpers');
const { confirmDelivery } = require('./orderController');

const getAssignedOrders = async (req, res, next) => {
  try {
    const partner = await DeliveryPartner.findOne({ user: req.user._id, isActive: true });
    if (!partner) throw new ApiError('Delivery partner profile not found', 404);

    const orders = await Order.find({
      deliveryPartner: partner._id,
      status: 'dispatched'
    })
      .sort({ createdAt: -1 })
      .populate('items.product')
      .populate('user', 'name phone');

    res.json({ success: true, orders: sanitizeOrders(orders), partner: { id: partner._id, name: partner.name } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAssignedOrders,
  confirmDelivery
};
