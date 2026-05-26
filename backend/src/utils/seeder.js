const SUPPLIERS = [
  { name: 'TechParts Global',    contact_email: 'orders@techparts.com',   phone: '+1-555-0101', lead_time_days: 5  },
  { name: 'ElectroHub Asia',     contact_email: 'supply@electrohub.asia', phone: '+65-555-0202', lead_time_days: 14 },
  { name: 'FastTrack Logistics', contact_email: 'sales@fasttrack.io',     phone: '+44-555-0303', lead_time_days: 3  },
  { name: 'MegaMart Wholesale',  contact_email: 'bulk@megamart.co',       phone: '+1-555-0404', lead_time_days: 7  },
  { name: 'Nordic Components',   contact_email: 'export@nordic.no',       phone: '+47-555-0505', lead_time_days: 21 },
];

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seedTenantData(client, tenantId, userId, userName, userEmail) {
  // Check if we already seeded this tenant (e.g. check if suppliers exist for this tenant)
  const existingSuppliers = await client.query('SELECT 1 FROM suppliers WHERE tenant_id = $1 LIMIT 1', [tenantId]);
  if (existingSuppliers.rowCount > 0) {
    return;
  }

  console.log(`🌱 Seeding demo data for tenant: ${tenantId}...`);

  // 1. Create the user with admin role
  await client.query(
    `INSERT INTO users (id, tenant_id, name, email, role)
     VALUES ($1, $2, $3, $4, 'admin')
     ON CONFLICT (id) DO NOTHING`,
    [userId, tenantId, userName || 'Demo User', userEmail || 'demo@ems.com']
  );

  // Add extra demo users for this tenant
  const warehouseUserId = `demo_wh_${tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`;
  const salesUserId = `demo_sl_${tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(-6)}`;
  await client.query(
    `INSERT INTO users (id, tenant_id, name, email, role)
     VALUES ($1, $2, 'Warehouse Manager', 'warehouse@ems.com', 'warehouse') ON CONFLICT (id) DO NOTHING`,
    [warehouseUserId, tenantId]
  );
  await client.query(
    `INSERT INTO users (id, tenant_id, name, email, role)
     VALUES ($1, $2, 'Sales Rep', 'sales@ems.com', 'sales') ON CONFLICT (id) DO NOTHING`,
    [salesUserId, tenantId]
  );

  const userIds = [userId, warehouseUserId, salesUserId];

  // 2. Insert suppliers
  const supplierIds = [];
  for (const s of SUPPLIERS) {
    const { rows: [r] } = await client.query(
      `INSERT INTO suppliers (tenant_id, name, contact_email, phone, lead_time_days)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [tenantId, s.name, s.contact_email, s.phone, s.lead_time_days]
    );
    supplierIds.push(r.id);
  }

  // 3. Insert products
  const productNames = [
    ['Laptop Pro 15',      'Electronics', 75000],   ['Wireless Mouse',       'Electronics', 1200],
    ['Mechanical Keyboard','Electronics', 4500],     ['USB-C Hub 7-Port',     'Electronics', 2200],
    ['Monitor 27" 4K',     'Electronics', 28000],    ['Webcam HD 1080p',      'Electronics', 3500],
    ['Noise Cancelling BT','Electronics', 8900],     ['SSD 1TB NVMe',         'Electronics', 6800],
    ['RAM 16GB DDR5',      'Electronics', 5200],     ['Network Switch 24P',   'Electronics', 12000],
    ['Desk Chair Ergonomic','Furniture', 18000],      ['Standing Desk',        'Furniture', 24000],
    ['Monitor Arm Dual',   'Furniture', 5500],       ['Cable Management Box', 'Office Supplies', 800],
    ['Whiteboard 4x3ft',   'Furniture', 3200],       ['Filing Cabinet 4-Drw', 'Furniture', 9500],
    ['A4 Paper 500 Sheets','Office Supplies', 450],  ['Ballpoint Pens Box',   'Office Supplies', 350],
    ['Stapler Heavy Duty', 'Office Supplies', 680],  ['Printer Ink Set',      'Office Supplies', 1800],
  ];

  const productIds = [];
  for (let i = 0; i < productNames.length; i++) {
    const [name, cat, price] = productNames[i];
    const skuSymbol = tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    const sku = `SKU-${skuSymbol}-${String(i + 1).padStart(4, '0')}`;
    const { rows: [p] } = await client.query(
      `INSERT INTO products (tenant_id, sku, name, category, unit_price, reorder_level, supplier_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [tenantId, sku, name, cat, price, random(5, 20), pick(supplierIds)]
    );
    productIds.push(p.id);

    const qty = random(15, 120);
    await client.query(
      `INSERT INTO inventory (tenant_id, product_id, quantity_on_hand, warehouse_location)
       VALUES ($1, $2, $3, $4)`,
      [tenantId, p.id, qty, `RACK-${String.fromCharCode(65 + (i % 8))}-${random(1, 20)}`]
    );
  }

  // 4. Insert orders (seed 50 orders)
  const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  for (let i = 0; i < 50; i++) {
    const type   = Math.random() > 0.4 ? 'sale' : 'purchase';
    const status = pick(statuses);
    const daysAgo = random(0, 30);
    const ordSymbol = tenantId.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    const { rows: [order] } = await client.query(
      `INSERT INTO orders (tenant_id, order_number, status, type, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW()-($6||' days')::INTERVAL, NOW()-($6||' days')::INTERVAL)
       RETURNING id`,
      [tenantId, `ORD-${ordSymbol}-${String(i + 1).padStart(6, '0')}`, status, type, pick(userIds), daysAgo]
    );

    const itemCount = random(1, 3);
    const usedProducts = new Set();
    for (let j = 0; j < itemCount; j++) {
      let pid;
      do { pid = pick(productIds); } while (usedProducts.has(pid));
      usedProducts.add(pid);
      const { rows: [prod] } = await client.query('SELECT unit_price FROM products WHERE id=$1', [pid]);
      await client.query(
        `INSERT INTO order_items (tenant_id, order_id, product_id, quantity, unit_price_snapshot)
         VALUES ($1, $2, $3, $4, $5)`,
        [tenantId, order.id, pid, random(1, 10), prod.unit_price]
      );
    }

    // Stock movements for confirmed/delivered orders
    if (['confirmed', 'shipped', 'delivered'].includes(status)) {
      const items = await client.query('SELECT * FROM order_items WHERE order_id=$1', [order.id]);
      for (const item of items.rows) {
        const mvType = type === 'sale' ? 'out' : 'in';
        const changeQty = type === 'sale' ? -item.quantity : item.quantity;
        await client.query(
          `INSERT INTO stock_movements (tenant_id, product_id, order_id, change_qty, movement_type, performed_by, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW()-($7||' days')::INTERVAL)`,
          [tenantId, item.product_id, order.id, changeQty, mvType, pick(userIds), daysAgo]
        );
      }
    }
  }

  console.log(`✅ Seeding complete for tenant: ${tenantId}`);
}

module.exports = { seedTenantData };
