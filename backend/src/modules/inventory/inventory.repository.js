const pool = require('../../config/db');

class InventoryRepository {
  async findAll() {
    const { rows } = await pool.query(
      `SELECT i.*, p.name AS product_name, p.sku, p.category, p.reorder_level,
              p.unit_price, s.name AS supplier_name,
              (i.quantity_on_hand <= p.reorder_level) AS is_low_stock
       FROM inventory i
       JOIN products  p ON p.id = i.product_id AND p.is_active = TRUE
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       ORDER BY p.name`
    );
    return rows;
  }

  async findLowStock() {
    const { rows } = await pool.query(
      `SELECT i.*, p.name AS product_name, p.sku, p.category, p.reorder_level,
              s.name AS supplier_name, s.contact_email AS supplier_email,
              s.lead_time_days
       FROM inventory i
       JOIN products  p ON p.id = i.product_id AND p.is_active = TRUE
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE i.quantity_on_hand <= p.reorder_level
       ORDER BY i.quantity_on_hand ASC`
    );
    return rows;
  }

  async findByProduct(productId) {
    const { rows } = await pool.query(
      'SELECT * FROM inventory WHERE product_id = $1', [productId]
    );
    return rows[0] || null;
  }

  // Used inside transactions — accepts a client
  async decrementQty(productId, qty, client = pool) {
    const { rows } = await client.query(
      `UPDATE inventory SET quantity_on_hand = quantity_on_hand - $1, last_updated = NOW()
       WHERE product_id = $2
       RETURNING quantity_on_hand`,
      [qty, productId]
    );
    return rows[0];
  }

  async incrementQty(productId, qty, client = pool) {
    const { rows } = await client.query(
      `UPDATE inventory SET quantity_on_hand = quantity_on_hand + $1, last_updated = NOW()
       WHERE product_id = $2
       RETURNING quantity_on_hand`,
      [qty, productId]
    );
    return rows[0];
  }

  async setQty(productId, qty, location) {
    const { rows } = await pool.query(
      `UPDATE inventory SET quantity_on_hand = $1, warehouse_location = COALESCE($2, warehouse_location),
              last_updated = NOW()
       WHERE product_id = $3 RETURNING *`,
      [qty, location, productId]
    );
    return rows[0] || null;
  }
}

module.exports = new InventoryRepository();
