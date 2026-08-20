const { AppError } = require('./errorHandler');

module.exports = function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(new AppError('관리자만 접근할 수 있습니다.', 403));
  }
  next();
};
