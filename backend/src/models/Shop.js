const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  address: { type: String, required: true },
  campus: { type: String, required: true },
  tags: [{ type: String }],
  contactNumber: { type: String },
  bannerImage: { type: String },
  isOpen: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shop', shopSchema);
