const { body } = require('express-validator');

const vendorRegisterValidator = [
  body('storeName').notEmpty().withMessage('Store name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('categories').isArray({ min: 1 }).withMessage('At least one category is required'),
  body('campus').notEmpty().withMessage('Campus is required')
];

module.exports = { vendorRegisterValidator };
