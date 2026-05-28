const User = require('../models/User');
const Notification = require('../models/Notification');
const Product = require('../models/Product');
const { ApiError } = require('../middlewares/errorHandler');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('wishlist')
      .populate('cart.product')
      .lean();
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    if (!user) throw new ApiError('User not found', 404);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError('User not found', 404);
    user.address.push(req.body);
    await user.save();
    res.status(201).json({ success: true, addresses: user.address });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

const getCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'cart.product',
      populate: [
        { path: 'shop', select: 'name isOpen' },
        { path: 'vendor', select: 'storeName isApproved' },
        { path: 'category', select: 'title' }
      ]
    });
    if (!user) throw new ApiError('User not found', 404);
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) throw new ApiError('Product ID is required', 400);
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError('User not found', 404);
    const product = await Product.findById(productId).populate('shop vendor');
    if (!product || !product.isActive) throw new ApiError('Product is unavailable at this moment', 400);
    if (!product.shop?.isOpen || !product.vendor?.isApproved) {
      throw new ApiError('This item is unavailable at this moment', 400);
    }

    const existingItem = user.cart.find(item => item.product.toString() === productId);
    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      user.cart.push({ product: productId, quantity: Number(quantity) });
    }

    await user.save();
    await user.populate('cart.product');
    res.status(201).json({ success: true, cart: user.cart });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;
    if (!quantity || Number(quantity) < 1) throw new ApiError('Quantity must be at least 1', 400);

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError('User not found', 404);
    const product = await Product.findById(productId).populate('shop vendor');
    if (!product || !product.isActive || !product.shop?.isOpen || !product.vendor?.isApproved) {
      throw new ApiError('This item is unavailable at this moment', 400);
    }

    const item = user.cart.find(cartItem => cartItem.product.toString() === productId);
    if (!item) throw new ApiError('Cart item not found', 404);
    item.quantity = Number(quantity);

    await user.save();
    await user.populate('cart.product');
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError('User not found', 404);

    user.cart = user.cart.filter(item => item.product.toString() !== productId);
    await user.save();
    await user.populate('cart.product');
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError('User not found', 404);
    user.cart = [];
    await user.save();
    res.json({ success: true, cart: [] });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  addAddress,
  getNotifications,
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};
