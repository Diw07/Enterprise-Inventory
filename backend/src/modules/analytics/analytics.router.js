const { Router } = require('express');
const ctrl = require('./analytics.controller');
const { verifyToken } = require('../../middleware/auth');

const router = Router();
const auth = verifyToken;

router.get('/kpis',           ...auth, ctrl.getKpis.bind(ctrl));
router.get('/top-products',   ...auth, ctrl.getTopProducts.bind(ctrl));
router.get('/stock-value',    ...auth, ctrl.getStockValue.bind(ctrl));
router.get('/movements',      ...auth, ctrl.getMovements.bind(ctrl));
router.get('/order-trend',    ...auth, ctrl.getOrderTrend.bind(ctrl));
router.get('/reorder-report', ...auth, ctrl.getReorderReport.bind(ctrl));

module.exports = router;
