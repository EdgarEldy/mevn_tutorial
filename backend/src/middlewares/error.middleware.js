const env = require('../config/env');

function errorMiddleware(err, req, res, next) {
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong.';

  const body = { success: false, message, errors: err.errors || null };
  if (env.nodeEnv === 'development') body.stack = err.stack;

  res.status(statusCode).json(body);
}

module.exports = errorMiddleware;
