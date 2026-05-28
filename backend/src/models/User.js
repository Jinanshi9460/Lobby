const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ['student', 'vendor', 'admin', 'delivery'], default: 'student' },
  isVerified: { type: Boolean, default: false },
  isSuspended: { type: Boolean, default: false },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  address: [{ label: String, street: String, city: String, state: String, zipcode: String, phone: String }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, quantity: { type: Number, default: 1 } }],
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
