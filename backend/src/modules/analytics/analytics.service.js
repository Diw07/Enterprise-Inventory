const pool = require('../../config/db');

class AnalyticsService {
  async getKpis() {
    const [stockValue, pendingOrders, lowStock, ordersThisMonth] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(i.quantity_on_hand * p.unit_price), 0) AS total_stock_value
                  FROM inventory i JOIN products p ON p.id = i.product_id AND p.is_active = TRUE`),
      pool.query(`SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*)::int AS count FROM inventory i
                  JOIN products p ON p.id = i.product_id AND p.is_active = TRUE
                  WHERE i.quantity_on_hand <= p.reorder_level`),
      pool.query(`SELECT COUNT(*)::int AS count FROM orders
                  WHERE created_at >= date_trunc('month', NOW())`),
    ]);

    return {
      total_stock_value:   parseFloat(stockValue.rows[0].total_stock_value),
      pending_orders:      pendingOrders.rows[0].count,
      low_stock_count:     lowStock.rows[0].count,
      orders_this_month:   ordersThisMonth.rows[0].count,
    };
  }

  async getTopProducts(limit = 10) {
    const { rows } = await pool.query(
      `SELECT p.id, p.name, p.sku, p.category,
              COALESCE(SUM(oi.quantity), 0)::int AS total_sold,
              COALESCE(SUM(oi.quantity * oi.unit_price_snapshot), 0) AS total_revenue
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.type = 'sale' AND o.status != 'cancelled'
       WHERE p.is_active = TRUE
       GROUP BY p.id, p.name, p.sku, p.category
       ORDER BY total_sold DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }

  async getStockValue() {
    const { rows } = await pool.query(
      `SELECT p.category,
              COALESCE(SUM(i.quantity_on_hand * p.unit_price), 0) AS value,
              COUNT(p.id)::int AS product_count
       FROM inventory i
       JOIN products p ON p.id = i.product_id AND p.is_active = TRUE
       GROUP BY p.category
       ORDER BY value DESC`
    );
    return rows;
  }

  async getMovementsTrend(days = 30) {
    const { rows } = await pool.query(
      `SELECT DATE(created_at) AS date,
              SUM(CASE WHEN movement_type = 'in'  THEN change_qty ELSE 0 END)::int AS stock_in,
              ABS(SUM(CASE WHEN movement_type = 'out' THEN change_qty ELSE 0 END))::int AS stock_out
       FROM stock_movements
       WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );
    return rows;
  }

  async getOrderTrend(days = 30) {
    const { rows } = await pool.query(
      `SELECT DATE(created_at) AS date,
              SUM(CASE WHEN type='purchase' THEN 1 ELSE 0 END)::int AS purchases,
              SUM(CASE WHEN type='sale'     THEN 1 ELSE 0 END)::int AS sales
       FROM orders
       WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );
    return rows;
  }

  async getReorderReport() {
    const { rows } = await pool.query(
      `SELECT p.id, p.sku, p.name, p.category, p.reorder_level,
              i.quantity_on_hand, (p.reorder_level - i.quantity_on_hand) AS units_needed,
              s.name AS supplier_name, s.contact_email, s.lead_time_days
       FROM inventory i
       JOIN products p ON p.id = i.product_id AND p.is_active = TRUE
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE i.quantity_on_hand <= p.reorder_level
       ORDER BY units_needed DESC`
    );
    return rows;
  }
}

module.exports = new AnalyticsService();
