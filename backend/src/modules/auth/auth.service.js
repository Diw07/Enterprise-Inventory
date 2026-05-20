const bcrypt = require('bcryptjs');
const userRepo = require('../users/user.repository');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');

class AuthService {
  async register({ name, email, password, role = 'sales' }) {
    const existing = await userRepo.findByEmail(email);
    if (existing) {
      const err = new Error('Email already registered'); err.statusCode = 409; throw err;
    }
    const password_hash = await bcrypt.hash(password, 10);
    return userRepo.create({ name, email, password_hash, role });
  }

  async login(email, password) {
    const user = await userRepo.findByEmail(email);
    if (!user) { const e = new Error('Invalid credentials'); e.statusCode = 401; throw e; }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) { const e = new Error('Invalid credentials'); e.statusCode = 401; throw e; }

    const payload = { id: user.id, role: user.role, name: user.name };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user.id });

    await userRepo.updateRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  }

  async refresh(token) {
    let decoded;
    try { decoded = verifyRefreshToken(token); }
    catch { const e = new Error('Invalid refresh token'); e.statusCode = 401; throw e; }

    const stored = await userRepo.getRefreshToken(decoded.id);
    if (stored !== token) {
      // Token reuse detected — invalidate all sessions
      await userRepo.updateRefreshToken(decoded.id, null);
      const e = new Error('Refresh token reuse detected'); e.statusCode = 401; throw e;
    }

    const user = await userRepo.findById(decoded.id);
    if (!user) { const e = new Error('User not found'); e.statusCode = 401; throw e; }

    const payload = { id: user.id, role: user.role, name: user.name };
    const accessToken  = signAccessToken(payload);
    const refreshToken = signRefreshToken({ id: user.id });
    await userRepo.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async logout(userId) {
    await userRepo.updateRefreshToken(userId, null);
  }
}

module.exports = new AuthService();
