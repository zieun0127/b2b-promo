const { AppError } = require('../errors');

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  if (status >= 500) console.error(err);
  res.status(status).json({ message, status });
}

module.exports = { AppError, errorHandler };
