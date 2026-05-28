const User = require('../models/User');
const Vendor = require('../models/Vendor');
const DeliveryPartner = require('../models/DeliveryPartner');
const { ApiError } = require('../middlewares/errorHandler');

const getVendorForUser = async userId => {
  const vendor = await Vendor.findOne({ user: userId });
  if (!vendor) throw new ApiError('Vendor profile not found', 404);
  return vendor;
};

const listDeliveryPartners = async (req, res, next) => {
  try {
    const vendor = await getVendorForUser(req.user._id);
    const partners = await DeliveryPartner.find({ vendor: vendor._id })
      .populate('user', 'email phone isSuspended')
      .sort({ createdAt: -1 });
    res.json({ success: true, partners });
  } catch (error) {
    next(error);
  }
};

const createDeliveryPartner = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) {
      throw new ApiError('Name, email, and password are required', 400);
    }
    if (password.length < 8) throw new ApiError('Password must be at least 8 characters', 400);

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) throw new ApiError('Email already in use', 409);

    const vendor = await getVendorForUser(req.user._id);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      password,
      role: 'delivery',
      isVerified: true
    });

    const partner = await DeliveryPartner.create({
      vendor: vendor._id,
      user: user._id,
      name,
      phone
    });

    res.status(201).json({
      success: true,
      partner: {
        ...partner.toObject(),
        user: { id: user._id, email: user.email, phone: user.phone }
      }
    });
  } catch (error) {
    next(error);
  }
};

const updateDeliveryPartner = async (req, res, next) => {
  try {
    const vendor = await getVendorForUser(req.user._id);
    const partner = await DeliveryPartner.findOne({ _id: req.params.id, vendor: vendor._id });
    if (!partner) throw new ApiError('Delivery partner not found', 404);

    if (req.body.name) partner.name = req.body.name;
    if (req.body.phone !== undefined) partner.phone = req.body.phone;
    if (typeof req.body.isActive === 'boolean') partner.isActive = req.body.isActive;
    await partner.save();

    if (typeof req.body.isActive === 'boolean') {
      await User.findByIdAndUpdate(partner.user, { isSuspended: !req.body.isActive });
    }

    res.json({ success: true, partner });
  } catch (error) {
    next(error);
  }
};

const deleteDeliveryPartner = async (req, res, next) => {
  try {
    const vendor = await getVendorForUser(req.user._id);
    const partner = await DeliveryPartner.findOne({ _id: req.params.id, vendor: vendor._id });
    if (!partner) throw new ApiError('Delivery partner not found', 404);

    partner.isActive = false;
    await partner.save();
    await User.findByIdAndUpdate(partner.user, { isSuspended: true });

    res.json({ success: true, message: 'Delivery partner deactivated' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner
};
