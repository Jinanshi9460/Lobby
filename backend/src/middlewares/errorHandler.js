class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.error(err);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server error',
    details: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = { ApiError, errorHandler };
