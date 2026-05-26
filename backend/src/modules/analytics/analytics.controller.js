const service = require('./analytics.service');
const { ok } = require('../../utils/response');

class AnalyticsController {
  async getKpis(req, res, next)          { try { return ok(res, await service.getKpis(req.user.tenantId)); } catch(e){next(e);} }
  async getTopProducts(req, res, next)   { try { return ok(res, await service.getTopProducts(req.user.tenantId, req.query.limit)); } catch(e){next(e);} }
  async getStockValue(req, res, next)    { try { return ok(res, await service.getStockValue(req.user.tenantId)); } catch(e){next(e);} }
  async getMovements(req, res, next)     { try { return ok(res, await service.getMovementsTrend(req.user.tenantId, req.query.days)); } catch(e){next(e);} }
  async getOrderTrend(req, res, next)    { try { return ok(res, await service.getOrderTrend(req.user.tenantId, req.query.days)); } catch(e){next(e);} }
  async getReorderReport(req, res, next) { try { return ok(res, await service.getReorderReport(req.user.tenantId)); } catch(e){next(e);} }
}

module.exports = new AnalyticsController();
