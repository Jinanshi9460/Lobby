const { validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(err => `${err.param}: ${err.msg}`).join(', ');
    return next(new ApiError(message, 422));
  }
  next();
};

module.exports = { runValidation };
