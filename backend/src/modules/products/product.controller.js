const service = require('./product.service');
const { ok, created, noContent, notFound } = require('../../utils/response');

class ProductController {
  async getAll(req, res, next) {
    try { return ok(res, await service.getAll(req.query)); }
    catch (e) { next(e); }
  }

  async getCategories(req, res, next) {
    try { return ok(res, await service.getCategories()); }
    catch (e) { next(e); }
  }

  async getById(req, res, next) {
    try {
      const p = await service.getById(req.params.id);
      return p ? ok(res, p) : notFound(res, 'Product');
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try { return created(res, await service.create(req.body)); }
    catch (e) { next(e); }
  }

  async update(req, res, next) {
    try {
      const p = await service.update(req.params.id, req.body);
      return p ? ok(res, p) : notFound(res, 'Product');
    } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try { await service.delete(req.params.id); return noContent(res); }
    catch (e) { next(e); }
  }
}

module.exports = new ProductController();
