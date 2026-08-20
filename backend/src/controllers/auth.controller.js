const authService = require('../services/auth.service');

async function signup(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await authService.signup({ email, password });
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;
    const result = await authService.refresh(refresh_token);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, refresh };
