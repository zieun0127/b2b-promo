const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

module.exports = function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('인증 토큰이 없거나 유효하지 않습니다.', 401));
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    next(new AppError('인증 토큰이 없거나 유효하지 않습니다.', 401));
  }
};
