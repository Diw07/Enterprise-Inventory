require('dotenv').config();
const pool   = require('./src/config/db');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

const SUPPLIERS = [
  { name: 'TechParts Global',    contact_email: 'orders@techparts.com',   phone: '+1-555-0101', lead_time_days: 5  },
  { name: 'ElectroHub Asia',     contact_email: 'supply@electrohub.asia', phone: '+65-555-0202', lead_time_days: 14 },
  { name: 'FastTrack Logistics', contact_email: 'sales@fasttrack.io',     phone: '+44-555-0303', lead_time_days: 3  },
  { name: 'MegaMart Wholesale',  contact_email: 'bulk@megamart.co',       phone: '+1-555-0404', lead_time_days: 7  },
  { name: 'Nordic Components',   contact_email: 'export@nordic.no',       phone: '+47-555-0505', lead_time_days: 21 },
  { name: 'ProSupply Inc',       contact_email: 'info@prosupply.com',     phone: '+1-555-0606', lead_time_days: 4  },
  { name: 'EastWest Trading',    contact_email: 'trade@ewt.hk',           phone: '+852-555-0707', lead_time_days: 18 },
  { name: 'GreenGoods Co',       contact_email: 'eco@greengoods.org',     phone: '+1-555-0808', lead_time_days: 6  },
  { name: 'Rapid Replenish',     contact_email: 'restock@rapid.com',      phone: '+1-555-0909', lead_time_days: 2  },
  { name: 'QualityFirst Ltd',    contact_email: 'quality@qfl.com',        phone: '+61-555-1010', lead_time_days: 10 },
];

const CATEGORIES = ['Electronics', 'Office Supplies', 'Furniture', 'Tools', 'Safety Equipment'];

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick   = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
    console.error('❌ ERROR: Database seeding is disabled in production environment to prevent data loss. Use FORCE_SEED=true to override.');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    // Check if database already has users
    const userCountRes = await client.query("SELECT COUNT(*)::int AS count FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'");
    if (userCountRes.rows[0].count > 0) {
      const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM users');
      if (rows[0].count > 0 && process.env.FORCE_SEED !== 'true') {
        console.error('❌ ERROR: Database already contains data. Seeding aborted to prevent overwriting your database.');
        console.error('If you really want to clear and seed this database, run: FORCE_SEED=true npm run seed');
        client.release();
        process.exit(1);
      }
    }

    await client.query('BEGIN');

    // Clear existing data
    await client.query('DELETE FROM stock_movements');
    await client.query('DELETE FROM order_items');
    await client.query('DELETE FROM orders');
    await client.query('DELETE FROM inventory');
    await client.query('DELETE FROM products');
    await client.query('DELETE FROM suppliers');
    await client.query('DELETE FROM users');

    // USERS
    const hash = await bcrypt.hash('password123', 10);
    const { rows: [admin] } = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`,
      ['Admin User', 'admin@ems.com', hash, 'admin']
    );
    const { rows: [warehouse] } = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`,
      ['Warehouse Manager', 'warehouse@ems.com', hash, 'warehouse']
    );
    const { rows: [sales] } = await client.query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`,
      ['Sales Rep', 'sales@ems.com', hash, 'sales']
    );
    const userIds = [admin.id, warehouse.id, sales.id];

    // SUPPLIERS
    const supplierIds = [];
    for (const s of SUPPLIERS) {
      const { rows: [r] } = await client.query(
        `INSERT INTO suppliers (name, contact_email, phone, lead_time_days) VALUES ($1,$2,$3,$4) RETURNING id`,
        [s.name, s.contact_email, s.phone, s.lead_time_days]
      );
      supplierIds.push(r.id);
    }

    // PRODUCTS
    const productNames = [
      ['Laptop Pro 15',      'Electronics', 75000],   ['Wireless Mouse',       'Electronics', 1200],
      ['Mechanical Keyboard','Electronics', 4500],     ['USB-C Hub 7-Port',     'Electronics', 2200],
      ['Monitor 27" 4K',     'Electronics', 28000],    ['Webcam HD 1080p',      'Electronics', 3500],
      ['Noise Cancelling BT','Electronics', 8900],     ['SSD 1TB NVMe',         'Electronics', 6800],
      ['RAM 16GB DDR5',      'Electronics', 5200],     ['Network Switch 24P',   'Electronics', 12000],
      ['Desk Chair Ergonomic','Furniture', 18000],      ['Standing Desk',        'Furniture', 24000],
      ['Monitor Arm Dual',   'Furniture', 5500],       ['Cable Management Box', 'Office Supplies', 800],
      ['Whiteboard 4x3ft',   'Furniture', 3200],       ['Filing Cabinet 4-Drw', 'Furniture', 9500],
      ['Bookshelf Metal',    'Furniture', 7200],       ['Office Partition',     'Furniture', 14000],
      ['A4 Paper 500 Sheets','Office Supplies', 450],  ['Ballpoint Pens Box',   'Office Supplies', 350],
      ['Stapler Heavy Duty', 'Office Supplies', 680],  ['Printer Ink Set',      'Office Supplies', 1800],
      ['Correction Tape',    'Office Supplies', 120],  ['Sticky Notes Pack',    'Office Supplies', 280],
      ['Scissors Set',       'Office Supplies', 420],  ['Tape Dispenser',       'Office Supplies', 560],
      ['Drill Driver 18V',   'Tools', 8500],           ['Angle Grinder 4.5"',   'Tools', 6200],
      ['Torque Wrench Set',  'Tools', 4800],           ['Socket Set 72pc',      'Tools', 3600],
      ['Utility Knife 10pk', 'Tools', 900],            ['Wire Stripper',        'Tools', 1400],
      ['Multimeter Digital', 'Tools', 2200],           ['Extension Cord 5m',    'Tools', 750],
      ['Tool Box Large',     'Tools', 5400],           ['Level Laser',          'Tools', 7800],
      ['Safety Helmet ABS',  'Safety Equipment', 1200],['Hi-Vis Vest M',        'Safety Equipment', 380],
      ['Safety Gloves Pair', 'Safety Equipment', 450], ['Safety Boots Size 9',  'Safety Equipment', 3200],
      ['First Aid Kit L',    'Safety Equipment', 2800],['Fire Extinguisher 5kg','Safety Equipment', 4500],
      ['Safety Goggles',     'Safety Equipment', 650], ['Ear Protection Pair',  'Safety Equipment', 820],
      ['Face Mask N95 50pk', 'Safety Equipment', 1600],['Reflective Tape 50m',  'Safety Equipment', 550],
    ];

    const productIds = [];
    for (let i = 0; i < productNames.length; i++) {
      const [name, cat, price] = productNames[i];
      const sku = `SKU-${String(i + 1).padStart(4, '0')}`;
      const { rows: [p] } = await client.query(
        `INSERT INTO products (sku, name, category, unit_price, reorder_level, supplier_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [sku, name, cat, price, random(5, 20), pick(supplierIds)]
      );
      productIds.push(p.id);

      const qty = random(0, 150);
      await client.query(
        `INSERT INTO inventory (product_id, quantity_on_hand, warehouse_location)
         VALUES ($1,$2,$3)`,
        [p.id, qty, `RACK-${String.fromCharCode(65 + (i % 8))}-${random(1, 20)}`]
      );
    }

    // ORDERS + ORDER ITEMS
    const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    for (let i = 0; i < 200; i++) {
      const type   = Math.random() > 0.4 ? 'sale' : 'purchase';
      const status = pick(statuses);
      const daysAgo = random(0, 90);
      const { rows: [order] } = await client.query(
        `INSERT INTO orders (order_number, status, type, created_by, created_at, updated_at)
         VALUES ($1,$2,$3,$4, NOW()-($5||' days')::INTERVAL, NOW()-($5||' days')::INTERVAL)
         RETURNING id`,
        [`ORD-${String(i + 1).padStart(6, '0')}`, status, type, pick(userIds), daysAgo]
      );

      const itemCount = random(1, 4);
      const usedProducts = new Set();
      for (let j = 0; j < itemCount; j++) {
        let pid;
        do { pid = pick(productIds); } while (usedProducts.has(pid));
        usedProducts.add(pid);
        const { rows: [prod] } = await client.query('SELECT unit_price FROM products WHERE id=$1', [pid]);
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price_snapshot)
           VALUES ($1,$2,$3,$4)`,
          [order.id, pid, random(1, 20), prod.unit_price]
        );
      }

      // Stock movements for confirmed/delivered orders
      if (['confirmed', 'shipped', 'delivered'].includes(status)) {
        const items = await client.query('SELECT * FROM order_items WHERE order_id=$1', [order.id]);
        for (const item of items.rows) {
          const mvType = type === 'sale' ? 'out' : 'in';
          const changeQty = type === 'sale' ? -item.quantity : item.quantity;
          await client.query(
            `INSERT INTO stock_movements (product_id, order_id, change_qty, movement_type, performed_by, created_at)
             VALUES ($1,$2,$3,$4,$5, NOW()-($6||' days')::INTERVAL)`,
            [item.product_id, order.id, changeQty, mvType, pick(userIds), daysAgo]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅  Seed complete. Demo credentials:');
    console.log('   Admin:     admin@ems.com     / password123');
    console.log('   Warehouse: warehouse@ems.com / password123');
    console.log('   Sales:     sales@ems.com     / password123');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌  Seed failed:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
