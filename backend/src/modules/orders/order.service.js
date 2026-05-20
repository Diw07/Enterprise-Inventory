const pool = require('../../config/db');
const orderRepo = require('./order.repository');
const invRepo   = require('../inventory/inventory.repository');
const productRepo = require('../products/product.repository');

class OrderService {
  async getAll(filters) { return orderRepo.findAll(filters); }

  async getById(id) {
    const order = await orderRepo.findById(id);
    if (!order) return null;
    order.items = await orderRepo.findItems(id);
    return order;
  }

  // CREATE ORDER (pending state — no stock movement yet)
  async create({ type, items, notes, userId }) {
    if (!items?.length) {
      const e = new Error('Order must have at least one item'); e.statusCode = 400; throw e;
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const order_number = await orderRepo.generateOrderNumber();
      const order = await orderRepo.create({ order_number, type, created_by: userId, notes }, client);

      for (const item of items) {
        const product = await productRepo.findById(item.product_id);
        if (!product) {
          const e = new Error(`Product ${item.product_id} not found`); e.statusCode = 400; throw e;
        }
        await orderRepo.insertItem({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price_snapshot: product.unit_price,
        }, client);
      }

      await client.query('COMMIT');
      return this.getById(order.id);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  // CONFIRM ORDER — the core transactional operation
  async confirm(orderId, userId) {
    const order = await orderRepo.findById(orderId);
    if (!order) { const e = new Error('Order not found'); e.statusCode = 404; throw e; }
    if (order.status !== 'pending') {
      const e = new Error(`Cannot confirm an order with status: ${order.status}`); e.statusCode = 400; throw e;
    }

    const items = await orderRepo.findItems(orderId);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const item of items) {
        if (order.type === 'sale') {
          // Validate stock availability before deducting
          const inv = await invRepo.findByProduct(item.product_id);
          if (!inv || inv.quantity_on_hand < item.quantity) {
            const e = new Error(`Insufficient stock for product: ${item.product_name}`);
            e.statusCode = 400; throw e;
          }
          await invRepo.decrementQty(item.product_id, item.quantity, client);
          await client.query(
            `INSERT INTO stock_movements (product_id, order_id, change_qty, movement_type, performed_by, notes)
             VALUES ($1,$2,$3,'out',$4,'Sale order confirmed')`,
            [item.product_id, orderId, -item.quantity, userId]
          );
        } else {
          // Purchase order — receive stock into inventory
          await invRepo.incrementQty(item.product_id, item.quantity, client);
          await client.query(
            `INSERT INTO stock_movements (product_id, order_id, change_qty, movement_type, performed_by, notes)
             VALUES ($1,$2,$3,'in',$4,'Purchase order confirmed')`,
            [item.product_id, orderId, item.quantity, userId]
          );
        }
      }

      await orderRepo.updateStatus(orderId, 'confirmed', client);
      await client.query('COMMIT');
      return this.getById(orderId);
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async updateStatus(orderId, status) {
    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      const e = new Error('Invalid status'); e.statusCode = 400; throw e;
    }
    if (status === 'confirmed') {
      // Route through confirm() for transactional stock ops
      const e = new Error('Use /confirm endpoint to confirm orders'); e.statusCode = 400; throw e;
    }
    return orderRepo.updateStatus(orderId, status);
  }

  async delete(orderId) {
    const order = await orderRepo.findById(orderId);
    if (!order) { const e = new Error('Order not found'); e.statusCode = 404; throw e; }
    if (!['pending', 'cancelled'].includes(order.status)) {
      const e = new Error('Only pending or cancelled orders can be deleted'); e.statusCode = 400; throw e;
    }
    return orderRepo.delete(orderId);
  }
}

module.exports = new OrderService();
