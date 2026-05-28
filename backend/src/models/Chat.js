const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage: { type: String },
  unreadCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
