const { body } = require('express-validator');

const checkoutValidator = [
  body('items').isArray({ min: 1 }).withMessage('Cart items are required'),
  body('shippingAddress.street').notEmpty().withMessage('Street is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.zipcode').notEmpty().withMessage('Zipcode is required'),
  body('paymentMethod').isIn(['razorpay', 'cod']).withMessage('Invalid payment method')
];

module.exports = { checkoutValidator };
