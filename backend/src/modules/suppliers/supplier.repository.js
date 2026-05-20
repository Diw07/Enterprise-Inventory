const pool = require('../../config/db');

class SupplierRepository {
  async findAll() {
    const { rows } = await pool.query(
      `SELECT s.*, COUNT(p.id)::int AS product_count
       FROM suppliers s
       LEFT JOIN products p ON p.supplier_id = s.id AND p.is_active = TRUE
       WHERE s.is_active = TRUE
       GROUP BY s.id
       ORDER BY s.name`
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findProducts(id) {
    const { rows } = await pool.query(
      `SELECT p.id, p.sku, p.name, p.category, p.unit_price, i.quantity_on_hand
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.supplier_id = $1 AND p.is_active = TRUE
       ORDER BY p.name`,
      [id]
    );
    return rows;
  }

  async create({ name, contact_email, phone, address, lead_time_days }) {
    const { rows } = await pool.query(
      `INSERT INTO suppliers (name, contact_email, phone, address, lead_time_days)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, contact_email, phone, address, lead_time_days]
    );
    return rows[0];
  }

  async update(id, { name, contact_email, phone, address, lead_time_days }) {
    const { rows } = await pool.query(
      `UPDATE suppliers SET name=$1, contact_email=$2, phone=$3, address=$4, lead_time_days=$5
       WHERE id=$6 RETURNING *`,
      [name, contact_email, phone, address, lead_time_days, id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    await pool.query('UPDATE suppliers SET is_active = FALSE WHERE id = $1', [id]);
  }
}

module.exports = new SupplierRepository();
