const pool = require('../../config/db');

class InventoryRepository {
  async findAll(tenantId) {
    const { rows } = await pool.query(
      `SELECT i.*, p.name AS product_name, p.sku, p.category, p.reorder_level,
              p.unit_price, s.name AS supplier_name,
              (i.quantity_on_hand <= p.reorder_level) AS is_low_stock
       FROM inventory i
       JOIN products  p ON p.id = i.product_id AND p.is_active = TRUE
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE i.tenant_id = $1
       ORDER BY p.name`,
      [tenantId]
    );
    return rows;
  }

  async findLowStock(tenantId) {
    const { rows } = await pool.query(
      `SELECT i.*, p.name AS product_name, p.sku, p.category, p.reorder_level,
              s.name AS supplier_name, s.contact_email AS supplier_email,
              s.lead_time_days
       FROM inventory i
       JOIN products  p ON p.id = i.product_id AND p.is_active = TRUE
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE i.quantity_on_hand <= p.reorder_level AND i.tenant_id = $1
       ORDER BY i.quantity_on_hand ASC`,
      [tenantId]
    );
    return rows;
  }

  async findByProduct(productId, tenantId) {
    const { rows } = await pool.query(
      'SELECT * FROM inventory WHERE product_id = $1 AND tenant_id = $2',
      [productId, tenantId]
    );
    return rows[0] || null;
  }

  // Used inside transactions — accepts a client
  async decrementQty(productId, qty, tenantId, client = pool) {
    const { rows } = await client.query(
      `UPDATE inventory SET quantity_on_hand = quantity_on_hand - $1, last_updated = NOW()
       WHERE product_id = $2 AND tenant_id = $3
       RETURNING quantity_on_hand`,
      [qty, productId, tenantId]
    );
    return rows[0];
  }

  async incrementQty(productId, qty, tenantId, client = pool) {
    const { rows } = await client.query(
      `UPDATE inventory SET quantity_on_hand = quantity_on_hand + $1, last_updated = NOW()
       WHERE product_id = $2 AND tenant_id = $3
       RETURNING quantity_on_hand`,
      [qty, productId, tenantId]
    );
    return rows[0];
  }

  async setQty(productId, qty, location, tenantId) {
    const { rows } = await pool.query(
      `UPDATE inventory SET quantity_on_hand = $1, warehouse_location = COALESCE($2, warehouse_location),
              last_updated = NOW()
       WHERE product_id = $3 AND tenant_id = $4 RETURNING *`,
      [qty, location, productId, tenantId]
    );
    return rows[0] || null;
  }
}

module.exports = new InventoryRepository();
