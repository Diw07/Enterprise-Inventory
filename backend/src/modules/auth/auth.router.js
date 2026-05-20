const { Router } = require('express');
const ctrl = require('./auth.controller');
const { verifyToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/role');

const router = Router();

router.post('/register', verifyToken, requireRole('admin'), ctrl.register.bind(ctrl));
router.post('/login',    ctrl.login.bind(ctrl));
router.post('/refresh',  ctrl.refresh.bind(ctrl));
router.post('/logout',   verifyToken, ctrl.logout.bind(ctrl));
router.get('/me',        verifyToken, ctrl.me.bind(ctrl));

module.exports = router;
