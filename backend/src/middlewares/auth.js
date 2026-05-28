const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError } = require('./errorHandler');

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.cookies.accessToken;
    if (!authHeader) throw new ApiError('Authentication required', 401);

    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) throw new ApiError('User not found', 401);
    req.user = user;
    next();
  } catch (error) {
    next(new ApiError(error.message || 'Invalid token', 401));
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new ApiError('Insufficient permissions', 403));
  }
  next();
};

module.exports = { verifyToken, authorizeRoles };
