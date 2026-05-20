-- ============================================================
-- Enterprise Inventory Management System — Database Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'warehouse', 'sales');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');
CREATE TYPE order_type AS ENUM ('purchase', 'sale');
CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment');

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            user_role NOT NULL DEFAULT 'sales',
  refresh_token   TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SUPPLIERS
-- ============================================================
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150) NOT NULL,
  contact_email   VARCHAR(150),
  phone           VARCHAR(30),
  address         TEXT,
  lead_time_days  INT NOT NULL DEFAULT 7 CHECK (lead_time_days >= 0),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku             VARCHAR(60) NOT NULL UNIQUE,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  category        VARCHAR(80) NOT NULL,
  unit_price      NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  reorder_level   INT NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  supplier_id     UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category     ON products(category);
CREATE INDEX idx_products_supplier     ON products(supplier_id);
CREATE INDEX idx_products_sku          ON products(sku);

-- ============================================================
-- INVENTORY
-- ============================================================
CREATE TABLE inventory (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity_on_hand    INT NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
  warehouse_location  VARCHAR(50),
  last_updated        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_product ON inventory(product_id);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    VARCHAR(30) NOT NULL UNIQUE,
  status          order_status NOT NULL DEFAULT 'pending',
  type            order_type NOT NULL,
  created_by      UUID NOT NULL REFERENCES users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_type        ON orders(type);
CREATE INDEX idx_orders_created_by  ON orders(created_by);
CREATE INDEX idx_orders_created_at  ON orders(created_at DESC);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id                UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id              UUID NOT NULL REFERENCES products(id),
  quantity                INT NOT NULL CHECK (quantity > 0),
  unit_price_snapshot     NUMERIC(12, 2) NOT NULL CHECK (unit_price_snapshot >= 0),
  UNIQUE (order_id, product_id)
);

CREATE INDEX idx_order_items_order   ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================================
-- STOCK MOVEMENTS (audit trail)
-- ============================================================
CREATE TABLE stock_movements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id),
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  change_qty      INT NOT NULL,
  movement_type   movement_type NOT NULL,
  performed_by    UUID NOT NULL REFERENCES users(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movements_product    ON stock_movements(product_id);
CREATE INDEX idx_movements_order      ON stock_movements(order_id);
CREATE INDEX idx_movements_created_at ON stock_movements(created_at DESC);

-- ============================================================
-- UPDATED_AT auto-update function
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_products_updated_at  BEFORE UPDATE ON products  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_orders_updated_at    BEFORE UPDATE ON orders    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
