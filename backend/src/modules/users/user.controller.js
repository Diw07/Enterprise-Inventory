const userRepo = require('./user.repository');
const { ok, notFound, fail } = require('../../utils/response');

class UserController {
  async getAll(req, res, next) {
    try { return ok(res, await userRepo.findAll(req.user.tenantId)); }
    catch (e) { next(e); }
  }

  async getById(req, res, next) {
    try {
      const user = await userRepo.findById(req.params.id, req.user.tenantId);
      return user ? ok(res, user) : notFound(res, 'User');
    } catch (e) { next(e); }
  }

  async updateRole(req, res, next) {
    try {
      const { role } = req.body;
      const valid = ['admin', 'warehouse', 'sales'];
      if (!valid.includes(role)) return fail(res, 'Invalid role. Use: admin, warehouse, sales');
      const user = await userRepo.updateRole(req.params.id, role, req.user.tenantId);
      return user ? ok(res, user) : notFound(res, 'User');
    } catch (e) { next(e); }
  }

  async setActive(req, res, next) {
    try {
      const { is_active } = req.body;
      const user = await userRepo.setActive(req.params.id, !!is_active, req.user.tenantId);
      return user ? ok(res, user) : notFound(res, 'User');
    } catch (e) { next(e); }
  }

  async me(req, res) {
    try {
      const user = await userRepo.findById(req.user.id, req.user.tenantId);
      return user ? ok(res, user) : notFound(res, 'User');
    } catch (e) { return notFound(res, 'User'); }
  }
}

module.exports = new UserController();
