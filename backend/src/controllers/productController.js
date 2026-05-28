const Product = require('../models/Product');
const Category = require('../models/Category');
const Vendor = require('../models/Vendor');
const { ApiError } = require('../middlewares/errorHandler');

const listProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, sort = 'createdAt', category, search, priceMin, priceMax, tags, shop } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (shop) query.shop = shop;
    if (search) query.$text = { $search: search };
    if (priceMin || priceMax) query.price = {};
    if (priceMin) query.price.$gte = Number(priceMin);
    if (priceMax) query.price.$lte = Number(priceMax);
    if (tags) query.tags = { $in: tags.split(',') };
    const products = await Product.find(query)
      .populate('category', 'title')
      .populate('vendor', 'storeName isApproved')
      .populate('shop', 'name isOpen')
      .sort({ [sort]: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    const withAvailability = products.map(product => {
      const availability = product.shop?.isOpen && product.vendor?.isApproved && product.isActive;
      return {
        ...product.toObject(),
        isAvailable: Boolean(availability),
        unavailableReason: availability ? null : 'Unavailable at this moment'
      };
    });
    const total = await Product.countDocuments(query);
    res.json({ success: true, products: withAvailability, meta: { page: Number(page), limit: Number(limit), total } });
  } catch (error) {
    next(error);
  }
};

const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category')
      .populate('vendor')
      .populate('shop', 'name contactNumber isOpen');
    if (!product || !product.isActive) throw new ApiError('Product not found', 404);
    const availability = product.shop?.isOpen && product.vendor?.isApproved && product.isActive;
    res.json({
      success: true,
      product: {
        ...product.toObject(),
        isAvailable: Boolean(availability),
        unavailableReason: availability ? null : 'Unavailable at this moment'
      }
    });
  } catch (error) {
    next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    let vendorId = null;
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor) throw new ApiError('Vendor account is required', 403);
      vendorId = vendor._id;
    }
    const product = await Product.create({ ...req.body, vendor: vendorId });
    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) throw new ApiError('Product not found', 404);
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) throw new ApiError('Product not found', 404);
    res.json({ success: true, message: 'Product removed from marketplace' });
  } catch (error) {
    next(error);
  }
};

const searchProducts = async (req, res, next) => {
  try {
    const { q } = req.query;
    const products = await Product.find({ $text: { $search: q }, isActive: true })
      .limit(20)
      .populate('category')
      .populate('vendor', 'storeName isApproved')
      .populate('shop', 'name isOpen');
    const withAvailability = products.map(product => {
      const availability = product.shop?.isOpen && product.vendor?.isApproved && product.isActive;
      return {
        ...product.toObject(),
        isAvailable: Boolean(availability),
        unavailableReason: availability ? null : 'Unavailable at this moment'
      };
    });
    res.json({ success: true, products: withAvailability });
  } catch (error) {
    next(error);
  }
};

const trendingProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(8)
      .populate('category')
      .populate('vendor', 'storeName isApproved')
      .populate('shop', 'name isOpen');
    const withAvailability = products.map(product => {
      const availability = product.shop?.isOpen && product.vendor?.isApproved && product.isActive;
      return {
        ...product.toObject(),
        isAvailable: Boolean(availability),
        unavailableReason: availability ? null : 'Unavailable at this moment'
      };
    });
    res.json({ success: true, products: withAvailability });
  } catch (error) {
    next(error);
  }
};

const listCategories = async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ title: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, searchProducts, trendingProducts, listCategories };
