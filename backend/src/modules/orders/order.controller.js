const service = require('./order.service');
const { ok, created, noContent, notFound, fail } = require('../../utils/response');

class OrderController {
  async getAll(req, res, next) {
    try { return ok(res, await service.getAll(req.query)); }
    catch (e) { next(e); }
  }

  async getById(req, res, next) {
    try {
      const o = await service.getById(req.params.id);
      return o ? ok(res, o) : notFound(res, 'Order');
    } catch (e) { next(e); }
  }

  async create(req, res, next) {
    try {
      const { type, items, notes } = req.body;
      if (!type || !items) return fail(res, 'type and items are required');
      return created(res, await service.create({ type, items, notes, userId: req.user.id }));
    } catch (e) { next(e); }
  }

  async confirm(req, res, next) {
    try { return ok(res, await service.confirm(req.params.id, req.user.id)); }
    catch (e) { next(e); }
  }

  async updateStatus(req, res, next) {
    try {
      const o = await service.updateStatus(req.params.id, req.body.status);
      return o ? ok(res, o) : notFound(res, 'Order');
    } catch (e) { next(e); }
  }

  async delete(req, res, next) {
    try { await service.delete(req.params.id); return noContent(res); }
    catch (e) { next(e); }
  }
}

module.exports = new OrderController();
