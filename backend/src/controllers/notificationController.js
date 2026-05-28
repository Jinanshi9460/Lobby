const Notification = require('../models/Notification');
const { ApiError } = require('../middlewares/errorHandler');

const listNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
    if (!notification) throw new ApiError('Notification not found', 404);
    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

module.exports = { listNotifications, markAsRead };
