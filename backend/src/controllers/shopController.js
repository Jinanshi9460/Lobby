const Shop = require('../models/Shop');
const Product = require('../models/Product');
const { ApiError } = require('../middlewares/errorHandler');

const listShops = async (req, res, next) => {
  try {
    const shops = await Shop.find({}).populate({
      path: 'vendor',
      match: { isApproved: true },
      select: 'storeName rating'
    });
    const visibleShops = shops.filter(shop => shop.vendor);
    res.json({ success: true, shops: visibleShops });
  } catch (error) {
    next(error);
  }
};

const getShop = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate({
      path: 'vendor',
      match: { isApproved: true },
      select: 'storeName description rating contactNumber'
    });
    if (!shop || !shop.vendor) throw new ApiError('Shop not found', 404);
    res.json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

const getShopProducts = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate({
      path: 'vendor',
      match: { isApproved: true },
      select: 'storeName'
    });
    if (!shop || !shop.vendor) throw new ApiError('Shop not found', 404);
    const products = await Product.find({ shop: shop._id, isActive: true })
      .populate('category', 'title')
      .populate('vendor', 'storeName');
    res.json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

module.exports = { listShops, getShop, getShopProducts };
