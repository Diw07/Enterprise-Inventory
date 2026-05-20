const pool = require('../../config/db');

class ProductRepository {
  async findAll({ category, search, lowStock } = {}) {
    const conditions = ['p.is_active = TRUE'];
    const params = [];

    if (category) { params.push(category); conditions.push(`p.category = $${params.length}`); }
    if (search)   { params.push(`%${search}%`); conditions.push(`(p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`); }

    const where = conditions.join(' AND ');
    const having = lowStock === 'true' ? 'HAVING COALESCE(i.quantity_on_hand, 0) <= p.reorder_level' : '';

    const { rows } = await pool.query(
      `SELECT p.*, s.name AS supplier_name, COALESCE(i.quantity_on_hand, 0) AS quantity_on_hand,
              i.warehouse_location,
              (COALESCE(i.quantity_on_hand, 0) <= p.reorder_level) AS is_low_stock
       FROM products p
       LEFT JOIN suppliers s  ON s.id = p.supplier_id
       LEFT JOIN inventory  i ON i.product_id = p.id
       WHERE ${where}
       GROUP BY p.id, s.name, i.quantity_on_hand, i.warehouse_location
       ${having}
       ORDER BY p.name`,
      params
    );
    return rows;
  }

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT p.*, s.name AS supplier_name, COALESCE(i.quantity_on_hand, 0) AS quantity_on_hand,
              i.warehouse_location
       FROM products p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN inventory i ON i.product_id = p.id
       WHERE p.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  async getCategories() {
    const { rows } = await pool.query(
      'SELECT DISTINCT category FROM products WHERE is_active = TRUE ORDER BY category'
    );
    return rows.map(r => r.category);
  }

  async create({ sku, name, description, category, unit_price, reorder_level, supplier_id }, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO products (sku, name, description, category, unit_price, reorder_level, supplier_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [sku, name, description, category, unit_price, reorder_level, supplier_id]
    );
    return rows[0];
  }

  async update(id, { name, description, category, unit_price, reorder_level, supplier_id }) {
    const { rows } = await pool.query(
      `UPDATE products SET name=$1, description=$2, category=$3, unit_price=$4,
              reorder_level=$5, supplier_id=$6
       WHERE id=$7 RETURNING *`,
      [name, description, category, unit_price, reorder_level, supplier_id, id]
    );
    return rows[0] || null;
  }

  async delete(id) {
    await pool.query('UPDATE products SET is_active = FALSE WHERE id = $1', [id]);
  }
}

module.exports = new ProductRepository();
