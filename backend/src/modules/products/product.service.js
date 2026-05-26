const productRepo = require('./product.repository');
const pool = require('../../config/db');

class ProductService {
  async getAll(tenantId, filters) { return productRepo.findAll(tenantId, filters); }
  async getById(id, tenantId) { return productRepo.findById(id, tenantId); }
  async getCategories(tenantId) { return productRepo.getCategories(tenantId); }

  async create(data, tenantId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const product = await productRepo.create({ ...data, tenantId }, client);
      // Automatically create an inventory record for the new product
      await client.query(
        `INSERT INTO inventory (tenant_id, product_id, quantity_on_hand, warehouse_location)
         VALUES ($1, $2, $3, $4)`,
        [tenantId, product.id, data.initial_quantity || 0, data.warehouse_location || null]
      );
      await client.query('COMMIT');
      return product;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async update(id, tenantId, data) { return productRepo.update(id, tenantId, data); }
  async delete(id, tenantId) { return productRepo.delete(id, tenantId); }
}

module.exports = new ProductService();
