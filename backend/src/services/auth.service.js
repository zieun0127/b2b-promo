const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { AppError } = require('../errors');
const userDb = require('../db/user.db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function issueAccessToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  });
}

async function signup({ email, password }) {
  if (!email || !password) {
    throw new AppError('이메일과 비밀번호는 필수입니다.', 400);
  }
  if (!EMAIL_REGEX.test(email)) {
    throw new AppError('이메일 형식이 올바르지 않습니다.', 400);
  }
  const existing = await userDb.findByEmail(email);
  if (existing) {
    throw new AppError('이미 가입된 이메일입니다.', 409);
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userDb.create({ email, passwordHash });
  return { id: user.id, email: user.email, role: user.role, created_at: user.createdAt };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
  }
  const user = await userDb.findByEmail(email);
  if (!user) {
    throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
  }
  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) {
    throw new AppError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
  }

  const accessToken = issueAccessToken(user);
  const refreshToken = jwt.sign({ sub: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: { id: user.id, email: user.email, role: user.role, created_at: user.createdAt },
  };
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Refresh Token이 유효하지 않습니다.', 401);
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (e) {
    throw new AppError('Refresh Token이 유효하지 않습니다.', 401);
  }

  const user = await userDb.findById(payload.sub);
  if (!user) {
    throw new AppError('Refresh Token이 유효하지 않습니다.', 401);
  }

  return { access_token: issueAccessToken(user) };
}

module.exports = { signup, login, refresh };
