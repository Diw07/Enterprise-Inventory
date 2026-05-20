const { verifyAccessToken } = require('../utils/jwt');
const { fail } = require('../utils/response');

const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return fail(res, 'No token provided', 401);

  try {
    req.user = verifyAccessToken(auth.slice(7));
    next();
  } catch {
    return fail(res, 'Invalid or expired token', 401);
  }
};

module.exports = { verifyToken };
