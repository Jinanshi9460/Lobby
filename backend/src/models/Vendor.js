const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  storeName: { type: String, required: true, trim: true },
  contactNumber: { type: String, trim: true },
  description: { type: String, trim: true },
  categories: [{ type: String, trim: true }],
  coverImage: { type: String },
  profileImage: { type: String },
  isApproved: { type: Boolean, default: false },
  revenue: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  inventoryValue: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vendor', vendorSchema);
