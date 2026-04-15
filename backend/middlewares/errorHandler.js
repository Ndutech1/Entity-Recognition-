//backend/middlewares/errorHandler.js
const logger = require('../Utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusFromError =
    typeof err.statusCode === 'number' ? err.statusCode : null;
  let statusCode =
    statusFromError || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || 'Internal Server Error';

  // Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 404;
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    statusCode = 400;
  }

  logger.error('Request failed', {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = errorHandler;
