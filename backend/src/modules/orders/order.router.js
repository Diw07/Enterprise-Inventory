const { Router } = require('express');
const ctrl = require('./order.controller');
const { verifyToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');

const router = Router();
const auth = verifyToken;
const adminOnly = [verifyToken, requireRole('admin')];

router.get('/',                    auth, ctrl.getAll.bind(ctrl));
router.get('/:id',                 auth, ctrl.getById.bind(ctrl));
router.post('/',                   auth, ctrl.create.bind(ctrl));
router.post('/:id/confirm',        auth, ctrl.confirm.bind(ctrl));
router.patch('/:id/status',        auth, ctrl.updateStatus.bind(ctrl));
router.delete('/:id',              ...adminOnly, ctrl.delete.bind(ctrl));

module.exports = router;
