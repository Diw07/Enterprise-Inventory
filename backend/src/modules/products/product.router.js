const { Router } = require('express');
const ctrl = require('./product.controller');
const { verifyToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');

const router = Router();
const auth = verifyToken;
const adminOnly = [verifyToken, requireRole('admin')];

router.get('/categories', auth, ctrl.getCategories.bind(ctrl));
router.get('/',           auth, ctrl.getAll.bind(ctrl));
router.get('/:id',        auth, ctrl.getById.bind(ctrl));
router.post('/',          ...adminOnly, ctrl.create.bind(ctrl));
router.put('/:id',        ...adminOnly, ctrl.update.bind(ctrl));
router.delete('/:id',     ...adminOnly, ctrl.delete.bind(ctrl));

module.exports = router;
