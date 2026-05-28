const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Shop = require('../models/Shop');
const Notification = require('../models/Notification');
const { ApiError } = require('../middlewares/errorHandler');
const { sendEmail } = require('../utils/mailer');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const ALLOWED_EDU_REGEX = /\.(edu|edu\.[a-z]{2,}|ac\.[a-z]{2,})$/i;
const COMMON_PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'zoho.com'
]);

const isCollegeEmail = email => {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  const parts = normalizedEmail.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  if (!domain || COMMON_PERSONAL_EMAIL_DOMAINS.has(domain)) return false;
  if (ALLOWED_EDU_REGEX.test(domain)) return true;

  const allowlistedDomains = (process.env.COLLEGE_EMAIL_ALLOWLIST || '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean);
  return allowlistedDomains.includes(domain);
};

const signToken = user => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
};

const signRefreshToken = user => {
  return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d' });
};

const ensureVendorSetup = async (user, options = {}) => {
  const existingVendor = await Vendor.findOne({ user: user._id });
  if (existingVendor) return existingVendor;

  const inferredStoreName = options.storeName || `${user.name || 'Campus'} Store`;
  const vendor = await Vendor.create({
    user: user._id,
    storeName: inferredStoreName,
    contactNumber: user.phone || '',
    description: options.storeDescription || `Welcome to ${inferredStoreName}`,
    categories: ['Campus essentials'],
    isApproved: false
  });

  await Shop.create({
    vendor: vendor._id,
    name: inferredStoreName,
    description: options.storeDescription || `Welcome to ${inferredStoreName}`,
    address: options.address || 'Campus Market Street',
    contactNumber: user.phone || '',
    campus: options.campus || 'Main Campus',
    tags: ['new', 'campus'],
    rating: 4.2
  });

  return vendor;
};

const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, role = 'student', storeName, storeDescription, campus, address } = req.body;
    const existing = await User.findOne({ email });
    if (existing) throw new ApiError('Email already exists', 409);
    const userRole = role === 'vendor' ? 'vendor' : 'student';
    if (userRole === 'student' && !isCollegeEmail(email)) {
      throw new ApiError('Students must register using a valid college email address', 400);
    }
    const user = await User.create({ name, email, phone, password, role: userRole });

    if (userRole === 'vendor') {
      if (!storeName) throw new ApiError('Store name is required for vendor registration', 400);
      await ensureVendorSetup(user, {
        storeName,
        storeDescription,
        address,
        campus
      });
      await Notification.create({
        user: user._id,
        title: 'Vendor registration submitted',
        message: 'Your vendor account is created and waiting for admin approval.',
        type: 'system'
      }).catch(() => {});
      await sendEmail({
        to: user.email,
        subject: 'LOBBy: Vendor registration received',
        text: `Hello ${user.name || ''}, your vendor registration has been received and is currently pending admin approval. We will notify you once approved.`
      }).catch(() => {});
      return res.status(201).json({
        success: true,
        message: 'Admin approval pending. You can login after approval.',
        approvalPending: true,
        user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
      });
    }

    const token = signToken(user);
    const refreshToken = signRefreshToken(user);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' });
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new ApiError('Invalid credentials', 401);
    if (user.role === 'admin') throw new ApiError('Use admin login portal', 403);
    if (user.isSuspended) throw new ApiError('Account suspended', 403);
    if (user.role === 'student' && !isCollegeEmail(user.email)) {
      throw new ApiError('Student login requires a valid college email address', 403);
    }
    if (user.role === 'vendor') {
      const vendor = await Vendor.findOne({ user: user._id });
      if (!vendor) throw new ApiError('Vendor profile not found', 404);
      if (!vendor.isApproved) {
        throw new ApiError('Admin approval pending. Please wait until your vendor account is approved.', 403);
      }
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError('Invalid credentials', 401);
    const token = signToken(user);
    const refreshToken = signRefreshToken(user);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { email, password, adminKey } = req.body;
    if (process.env.ADMIN_LOGIN_SECRET && adminKey !== process.env.ADMIN_LOGIN_SECRET) {
      throw new ApiError('Invalid admin access key', 403);
    }
    const user = await User.findOne({ email });
    if (!user) throw new ApiError('Invalid credentials', 401);
    if (user.isSuspended) throw new ApiError('Account suspended', 403);
    if (user.role !== 'admin') throw new ApiError('Admin access required', 403);
    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError('Invalid credentials', 401);
    const token = signToken(user);
    const refreshToken = signRefreshToken(user);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) throw new ApiError('Refresh token required', 401);
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) throw new ApiError('User not found', 401);
    const newToken = signToken(user);
    res.json({ success: true, token: newToken });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
};

const profile = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ success: true, message: 'If this email exists, a reset link has been generated.' });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    const clientBase = process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5174';
    const resetUrl = `${clientBase}/reset-password/${rawToken}`;

    res.json({
      success: true,
      message: 'Password reset link generated successfully.',
      resetUrl
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 8) throw new ApiError('Password must be at least 8 characters', 400);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) throw new ApiError('Reset link is invalid or expired', 400);

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully. Please login.' });
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { credential, role = 'student', mode = 'login' } = req.body;
    if (!credential) throw new ApiError('Google credential is required', 400);
    if (!process.env.GOOGLE_CLIENT_ID) throw new ApiError('Google login is not configured', 500);

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload?.email;
    if (!email) throw new ApiError('Google account email unavailable', 400);

    let user = await User.findOne({ email });
    const requestedRole = role === 'vendor' ? 'vendor' : 'student';
    if (requestedRole === 'student' && !isCollegeEmail(email)) {
      throw new ApiError('Students must use a valid college Google account', 400);
    }

    if (mode === 'login') {
      if (!user) {
        throw new ApiError('User does not exist. Please register first.', 404);
      }
    } else if (mode === 'register') {
      if (user) {
        if (requestedRole !== 'vendor') {
          throw new ApiError('User already exists. Please login.', 409);
        }

        if (user.role === 'admin') {
          throw new ApiError('Admin cannot be registered as vendor', 403);
        }

        const existingVendor = await Vendor.findOne({ user: user._id });
        if (existingVendor?.isApproved) {
          throw new ApiError('Vendor already exists. Please login.', 409);
        }
        if (user.role !== 'vendor') {
          user.role = 'vendor';
          await user.save();
        }
      } else {
        const randomPassword = crypto.randomBytes(24).toString('hex');
        user = await User.create({
          name: payload?.name || email.split('@')[0],
          email,
          password: randomPassword,
          role: requestedRole,
          isVerified: true
        });
      }
    } else {
      throw new ApiError('Invalid Google auth mode', 400);
    }
    if (user.role === 'admin') {
      throw new ApiError('Admin must use secure admin login portal', 403);
    }

    if (requestedRole === 'vendor') {
      if (mode === 'login' && user.role !== 'vendor') {
        throw new ApiError('Vendor account not found. Please register as vendor first.', 403);
      }
      if (mode === 'register') {
        if (user.role !== 'vendor') {
          user.role = 'vendor';
          await user.save();
        }
      }
      const vendor = await Vendor.findOne({ user: user._id }) || await ensureVendorSetup(user);
      if (!vendor.isApproved) {
        if (mode === 'register') {
          await Notification.create({
            user: user._id,
            title: 'Vendor registration submitted',
            message: 'Your vendor account is created and waiting for admin approval.',
            type: 'system'
          }).catch(() => {});
          await sendEmail({
            to: user.email,
            subject: 'LOBBy: Vendor registration received',
            text: `Hello ${user.name || ''}, your vendor registration has been received and is currently pending admin approval. We will notify you once approved.`
          }).catch(() => {});
        }
        return res.status(200).json({
          success: true,
          message: 'Admin approval pending. You can login after approval.',
          approvalPending: true,
          user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
        });
      }
    }

    const token = signToken(user);
    const refreshToken = signRefreshToken(user);
    res.cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' });
    if (mode === 'login') {
      await Notification.create({
        user: user._id,
        title: 'Google login detected',
        message: `Your account was accessed with Google at ${new Date().toLocaleString()}.`,
        type: 'alert'
      }).catch(() => {});
      await sendEmail({
        to: user.email,
        subject: 'LOBBy: Google login detected',
        text: `Hello ${user.name || ''}, a Google login was detected on your LOBBy account at ${new Date().toLocaleString()}. If this was not you, please reset your password.`
      }).catch(() => {});
    }
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role } });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, adminLogin, refreshToken, logout, profile, forgotPassword, resetPassword, googleAuth };
