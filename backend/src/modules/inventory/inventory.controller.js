const service = require('./inventory.service');
const { ok, fail } = require('../../utils/response');

class InventoryController {
  async getAll(req, res, next) {
    try { return ok(res, await service.getAll(req.user.tenantId)); }
    catch (e) { next(e); }
  }

  async getLowStock(req, res, next) {
    try { return ok(res, await service.getLowStock(req.user.tenantId)); }
    catch (e) { next(e); }
  }

  async adjust(req, res, next) {
    try {
      const { product_id, qty, notes } = req.body;
      if (!product_id || qty === undefined) return fail(res, 'product_id and qty are required');
      return ok(res, await service.adjust(product_id, parseInt(qty), req.user.id, req.user.tenantId, notes));
    } catch (e) { next(e); }
  }

  async getMovements(req, res, next) {
    try { return ok(res, await service.getMovements(req.params.productId, req.user.tenantId)); }
    catch (e) { next(e); }
  }
}

module.exports = new InventoryController();
