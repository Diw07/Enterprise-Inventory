const authService = require('./auth.service');
const { ok, created, fail } = require('../../utils/response');

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

class AuthController {
  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      return created(res, user);
    } catch (e) { next(e); }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return fail(res, 'Email and password are required');
      const result = await authService.login(email, password);
      res.cookie('refreshToken', result.refreshToken, COOKIE_OPTS);
      return ok(res, { accessToken: result.accessToken, user: result.user });
    } catch (e) { next(e); }
  }

  async refresh(req, res, next) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) return fail(res, 'Refresh token required', 401);
      const tokens = await authService.refresh(token);
      res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTS);
      return ok(res, { accessToken: tokens.accessToken });
    } catch (e) { next(e); }
  }

  async logout(req, res, next) {
    try {
      await authService.logout(req.user.id);
      res.clearCookie('refreshToken');
      return ok(res, { message: 'Logged out' });
    } catch (e) { next(e); }
  }

  async me(req, res) {
    return ok(res, req.user);
  }
}

module.exports = new AuthController();
