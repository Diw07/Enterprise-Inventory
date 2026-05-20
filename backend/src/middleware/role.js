const { forbidden } = require('../utils/response');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role))
    return forbidden(res);
  next();
};

module.exports = { requireRole };
