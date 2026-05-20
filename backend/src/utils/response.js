const ok      = (res, data, status = 200)     => res.status(status).json({ success: true, data });
const created = (res, data)                    => ok(res, data, 201);
const noContent = (res)                        => res.status(204).send();
const fail    = (res, message, status = 400)  => res.status(status).json({ success: false, message });
const notFound = (res, entity = 'Resource')   => fail(res, `${entity} not found`, 404);
const forbidden = (res)                        => fail(res, 'Forbidden: insufficient permissions', 403);
const serverError = (res, err)                 => {
  console.error(err);
  return res.status(500).json({ success: false, message: 'Internal server error' });
};

module.exports = { ok, created, noContent, fail, notFound, forbidden, serverError };
