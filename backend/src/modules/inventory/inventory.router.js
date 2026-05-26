const { Router } = require('express');
const ctrl = require('./inventory.controller');
const { verifyToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');

const router = Router();
const auth = verifyToken;
const warehouseOrAdmin = [...verifyToken, requireRole('warehouse', 'admin')];

router.get('/',                         ...auth, ctrl.getAll.bind(ctrl));
router.get('/low-stock',                ...auth, ctrl.getLowStock.bind(ctrl));
router.get('/:productId/movements',     ...auth, ctrl.getMovements.bind(ctrl));
router.post('/adjust',    ...warehouseOrAdmin, ctrl.adjust.bind(ctrl));

module.exports = router;
