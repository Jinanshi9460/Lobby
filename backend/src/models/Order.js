const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1 },
    price: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  shippingAddress: { label: String, street: String, city: String, state: String, zipcode: String, phone: String },
  status: { type: String, enum: ['pending', 'confirmed', 'preparing', 'dispatched', 'delivered', 'cancelled'], default: 'pending' },
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], default: 'razorpay' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  deliveryEta: { type: Date },
  tracking: [{ status: String, updatedAt: Date, note: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
