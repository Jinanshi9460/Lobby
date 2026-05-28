const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['dispatched', 'cancelled'],
  dispatched: ['delivered'],
  delivered: [],
  cancelled: []
};

const generateDeliveryOtp = () => String(crypto.randomInt(100000, 999999));

const hashDeliveryOtp = async otp => bcrypt.hash(otp, 10);

const verifyDeliveryOtp = async (otp, hash) => bcrypt.compare(otp, hash);

const assertTransition = (currentStatus, nextStatus) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    const error = new Error(`Cannot move order from ${currentStatus} to ${nextStatus}`);
    error.statusCode = 400;
    throw error;
  }
};

const appendTracking = (order, status, note) => {
  order.tracking.push({ status, updatedAt: new Date(), note });
};

const sanitizeOrder = (order, options = {}) => {
  const doc = order.toObject ? order.toObject() : { ...order };
  delete doc.deliveryOtpHash;
  if (options.includeCustomerOtp && doc.status === 'dispatched' && doc.customerDeliveryOtp) {
    doc.deliveryOtp = doc.customerDeliveryOtp;
  }
  delete doc.customerDeliveryOtp;
  return doc;
};

const sanitizeOrders = (orders, options = {}) => orders.map(order => sanitizeOrder(order, options));

/** Backfill OTP for orders dispatched before customerDeliveryOtp existed */
const ensureCustomerDeliveryOtp = async (order, otpTtlMs = 24 * 60 * 60 * 1000) => {
  if (order.status !== 'dispatched' || order.customerDeliveryOtp) {
    return order;
  }
  const otp = generateDeliveryOtp();
  order.customerDeliveryOtp = otp;
  order.deliveryOtpHash = await hashDeliveryOtp(otp);
  order.deliveryOtpExpires = new Date(Date.now() + otpTtlMs);
  order.deliveryOtpAttempts = 0;
  await order.save();
  return order;
};

module.exports = {
  ALLOWED_TRANSITIONS,
  generateDeliveryOtp,
  hashDeliveryOtp,
  verifyDeliveryOtp,
  assertTransition,
  appendTracking,
  sanitizeOrder,
  sanitizeOrders,
  ensureCustomerDeliveryOtp
};
