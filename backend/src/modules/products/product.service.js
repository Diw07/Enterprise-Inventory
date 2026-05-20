// product.service.js
const productRepo = require('./product.repository');
const inventoryRepo = require('../inventory/inventory.repository');
const pool = require('../../config/db');

class ProductService {
  async getAll(filters) { return productRepo.findAll(filters); }
  async getById(id) { return productRepo.findById(id); }
  async getCategories() { return productRepo.getCategories(); }

  async create(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const product = await productRepo.create(data, client);
      // Automatically create an inventory record for the new product
      await client.query(
        `INSERT INTO inventory (product_id, quantity_on_hand, warehouse_location)
         VALUES ($1, $2, $3)`,
        [product.id, data.initial_quantity || 0, data.warehouse_location || null]
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

  async update(id, data) { return productRepo.update(id, data); }
  async delete(id) { return productRepo.delete(id); }
}

module.exports = new ProductService();
