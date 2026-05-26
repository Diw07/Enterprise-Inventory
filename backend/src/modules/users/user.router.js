const { Router } = require('express');
const ctrl = require('./user.controller');
const { verifyToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');

const router = Router();
const adminOnly = [...verifyToken, requireRole('admin')];

router.get('/me',           ...verifyToken, ctrl.me.bind(ctrl));
router.get('/',             ...adminOnly, ctrl.getAll.bind(ctrl));
router.get('/:id',          ...adminOnly, ctrl.getById.bind(ctrl));
router.patch('/:id/role',   ...adminOnly, ctrl.updateRole.bind(ctrl));
router.patch('/:id/active', ...adminOnly, ctrl.setActive.bind(ctrl));

module.exports = router;
