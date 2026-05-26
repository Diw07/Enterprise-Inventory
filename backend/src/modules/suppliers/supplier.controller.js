const repo = require('./supplier.repository');
const { ok, created, noContent, notFound } = require('../../utils/response');

class SupplierController {
  async getAll(req, res, next) {
    try { return ok(res, await repo.findAll(req.user.tenantId)); }
    catch (e) { next(e); }
  }

  async getById(req, res, next) {
    try {
      const s = await repo.findById(req.params.id, req.user.tenantId);
      return s ? ok(res, s) : notFound(res, 'Supplier');
    } catch (e) { next(e); }
  }

  async getProducts(req, res, next) {
    try { return ok(res, await repo.findProducts(req.params.id, req.user.tenantId)); }
    catch (e) { next(e); }
  }

  async create(req, res, next) {
    try { return created(res, await repo.create({ ...req.body, tenantId: req.user.tenantId })); }
    catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const s = await repo.update(req.params.id, req.user.tenantId, req.body);
      return s ? ok(res, s) : notFound(res, 'Supplier');
    } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try { await repo.delete(req.params.id, req.user.tenantId); return noContent(res); }
    catch (e) { next(e); }
  }
}

module.exports = new SupplierController();
