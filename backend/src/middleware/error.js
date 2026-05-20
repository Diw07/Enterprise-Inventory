const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Postgres unique violation
  if (err.code === '23505')
    return res.status(409).json({ success: false, message: 'Duplicate entry: ' + (err.detail || err.message) });

  // Postgres FK violation
  if (err.code === '23503')
    return res.status(400).json({ success: false, message: 'Referenced record does not exist' });

  // Postgres check violation
  if (err.code === '23514')
    return res.status(400).json({ success: false, message: 'Value violates a constraint: ' + (err.detail || '') });

  // Custom app errors with a statusCode
  if (err.statusCode)
    return res.status(err.statusCode).json({ success: false, message: err.message });

  res.status(500).json({ success: false, message: 'Internal server error' });
};

module.exports = { errorHandler };
