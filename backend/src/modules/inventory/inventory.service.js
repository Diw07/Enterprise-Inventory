const pool = require('../../config/db');
const invRepo = require('./inventory.repository');

class InventoryService {
  async getAll(tenantId)      { return invRepo.findAll(tenantId); }
  async getLowStock(tenantId) { return invRepo.findLowStock(tenantId); }

  // Manual adjustment (warehouse / admin only)
  async adjust(productId, qty, userId, tenantId, notes) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const current = await invRepo.findByProduct(productId, tenantId);
      if (!current) { const e = new Error('Inventory record not found'); e.statusCode = 404; throw e; }

      const newQty = current.quantity_on_hand + qty;
      if (newQty < 0) { const e = new Error('Adjustment would result in negative stock'); e.statusCode = 400; throw e; }

      await invRepo.setQty(productId, newQty, null, tenantId);

      await client.query(
        `INSERT INTO stock_movements (tenant_id, product_id, change_qty, movement_type, performed_by, notes)
         VALUES ($1, $2, $3, 'adjustment', $4, $5)`,
        [tenantId, productId, qty, userId, notes || 'Manual adjustment']
      );
      await client.query('COMMIT');
      return invRepo.findByProduct(productId, tenantId);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async getMovements(productId, tenantId, limit = 50) {
    const { rows } = await pool.query(
      `SELECT sm.*, u.name AS performed_by_name
       FROM stock_movements sm
       JOIN users u ON u.id = sm.performed_by
       WHERE sm.product_id = $1 AND sm.tenant_id = $2
       ORDER BY sm.created_at DESC LIMIT $3`,
      [productId, tenantId, limit]
    );
    return rows;
  }
}

module.exports = new InventoryService();
