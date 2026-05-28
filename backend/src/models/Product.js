const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  images: [{ type: String }],
  stock: { type: Number, required: true, default: 1 },
  tags: [{ type: String }],
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  rating: { type: Number, default: 0 },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
