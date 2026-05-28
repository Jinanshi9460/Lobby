const { body } = require('express-validator');

const createProductValidator = [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than zero'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a valid number'),
  body('category').notEmpty().withMessage('Category is required')
];

module.exports = { createProductValidator };
