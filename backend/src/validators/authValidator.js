const { body } = require('express-validator');

const registerValidator = [
  body('name').isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['student', 'vendor']).withMessage('Invalid role'),
  body('storeName')
    .if(body('role').equals('vendor'))
    .notEmpty()
    .withMessage('Store name is required for vendor accounts'),
  body('phone')
    .if(body('role').equals('vendor'))
    .notEmpty()
    .withMessage('Phone number is required for vendor accounts')
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

module.exports = { registerValidator, loginValidator };
