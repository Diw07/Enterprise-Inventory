const service = require('./product.service');
const { ok, created, noContent, notFound } = require('../../utils/response');

class ProductController {
  async getAll(req, res, next) {
    try { return ok(res, await service.getAll(req.user.tenantId, req.query)); }
    catch (e) { next(e); }
  }

  async getCategories(req, res, next) {
    try { return ok(res, await service.getCategories(req.user.tenantId)); }
    catch (e) { next(e); }
  }

  async getById(req, res, next) {
    try {
      const p = await service.getById(req.params.id, req.user.tenantId);
      return p ? ok(res, p) : notFound(res, 'Product');
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try { return created(res, await service.create(req.body, req.user.tenantId)); }
    catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const p = await service.update(req.params.id, req.user.tenantId, req.body);
      return p ? ok(res, p) : notFound(res, 'Product');
    } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try { await service.delete(req.params.id, req.user.tenantId); return noContent(res); }
    catch (e) { next(e); }
  }
}

module.exports = new ProductController();
