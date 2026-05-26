const pool = require('../../config/db');

class SupplierRepository {
  async findAll(tenantId) {
    const { rows } = await pool.query(
      `SELECT s.*, COUNT(p.id)::int AS product_count
       FROM suppliers s
       LEFT JOIN products p ON p.supplier_id = s.id AND p.is_active = TRUE
       WHERE s.is_active = TRUE AND s.tenant_id = $1
       GROUP BY s.id
       ORDER BY s.name`,
      [tenantId]
    );
    return rows;
  }

  async findById(id, tenantId) {
    const { rows } = await pool.query(
      'SELECT * FROM suppliers WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );
    return rows[0] || null;
  }

  async findProducts(id, tenantId) {
    const { rows } = await pool.query(
      `SELECT p.id, p.sku, p.name, p.category, p.unit_price, i.quantity_on_hand
       FROM products p
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.supplier_id = $1 AND p.is_active = TRUE AND p.tenant_id = $2
       ORDER BY p.name`,
      [id, tenantId]
    );
    return rows;
  }

  async create({ name, contact_email, phone, address, lead_time_days, tenantId }) {
    const { rows } = await pool.query(
      `INSERT INTO suppliers (tenant_id, name, contact_email, phone, address, lead_time_days)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, name, contact_email, phone, address, lead_time_days]
    );
    return rows[0];
  }

  async update(id, tenantId, { name, contact_email, phone, address, lead_time_days }) {
    const { rows } = await pool.query(
      `UPDATE suppliers SET name=$1, contact_email=$2, phone=$3, address=$4, lead_time_days=$5
       WHERE id=$6 AND tenant_id=$7 RETURNING *`,
      [name, contact_email, phone, address, lead_time_days, id, tenantId]
    );
    return rows[0] || null;
  }

  async delete(id, tenantId) {
    await pool.query('UPDATE suppliers SET is_active = FALSE WHERE id = $1 AND tenant_id = $2', [id, tenantId]);
  }
}

module.exports = new SupplierRepository();
