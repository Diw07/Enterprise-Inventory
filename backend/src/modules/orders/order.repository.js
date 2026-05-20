const pool = require('../../config/db');

class OrderRepository {
  async findAll({ status, type, from, to } = {}) {
    const conds = [];
    const params = [];

    if (status) { params.push(status); conds.push(`o.status = $${params.length}`); }
    if (type)   { params.push(type);   conds.push(`o.type = $${params.length}`); }
    if (from)   { params.push(from);   conds.push(`o.created_at >= $${params.length}`); }
    if (to)     { params.push(to);     conds.push(`o.created_at <= $${params.length}`); }

    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

    const { rows } = await pool.query(
      `SELECT o.*, u.name AS created_by_name,
              COUNT(oi.id)::int AS item_count,
              COALESCE(SUM(oi.quantity * oi.unit_price_snapshot), 0) AS total_value
       FROM orders o
       JOIN users u ON u.id = o.created_by
       LEFT JOIN order_items oi ON oi.order_id = o.id
       ${where}
       GROUP BY o.id, u.name
       ORDER BY o.created_at DESC`,
      params
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT o.*, u.name AS created_by_name
       FROM orders o JOIN users u ON u.id = o.created_by
       WHERE o.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async findItems(orderId) {
    const { rows } = await pool.query(
      `SELECT oi.*, p.name AS product_name, p.sku, p.category
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1`,
      [orderId]
    );
    return rows;
  }

  // All mutation methods accept an optional pg client for transactions
  async create({ order_number, type, created_by, notes }, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO orders (order_number, type, created_by, notes)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [order_number, type, created_by, notes]
    );
    return rows[0];
  }

  async insertItem({ order_id, product_id, quantity, unit_price_snapshot }, client = pool) {
    await client.query(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price_snapshot)
       VALUES ($1,$2,$3,$4)`,
      [order_id, product_id, quantity, unit_price_snapshot]
    );
  }

  async updateStatus(id, status, client = pool) {
    const { rows } = await client.query(
      `UPDATE orders SET status=$1 WHERE id=$2 RETURNING *`,
      [status, id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
  }

  async generateOrderNumber() {
    const { rows } = await pool.query('SELECT COUNT(*) FROM orders');
    const n = parseInt(rows[0].count, 10) + 1;
    return `ORD-${String(n).padStart(6, '0')}`;
  }
}

module.exports = new OrderRepository();
