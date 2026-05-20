const service = require('./analytics.service');
const { ok } = require('../../utils/response');

class AnalyticsController {
  async getKpis(req, res, next)          { try { return ok(res, await service.getKpis()); } catch(e){next(e);} }
  async getTopProducts(req, res, next)   { try { return ok(res, await service.getTopProducts(req.query.limit)); } catch(e){next(e);} }
  async getStockValue(req, res, next)    { try { return ok(res, await service.getStockValue()); } catch(e){next(e);} }
  async getMovements(req, res, next)     { try { return ok(res, await service.getMovementsTrend(req.query.days)); } catch(e){next(e);} }
  async getOrderTrend(req, res, next)    { try { return ok(res, await service.getOrderTrend(req.query.days)); } catch(e){next(e);} }
  async getReorderReport(req, res, next) { try { return ok(res, await service.getReorderReport()); } catch(e){next(e);} }
}

module.exports = new AnalyticsController();
