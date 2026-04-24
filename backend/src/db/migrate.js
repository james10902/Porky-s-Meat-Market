/**
 * Database migration — creates all tables from scratch.
 * Run: node src/db/migrate.js
 */
require('dotenv').config();
const { pool } = require('./pool');

const SQL = `
-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  firstname     VARCHAR(80) NOT NULL,
  lastname      VARCHAR(80) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  password_hash TEXT        NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'customer',  -- customer | admin | wholesale
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ── Categories ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL      PRIMARY KEY,
  name        VARCHAR(80) NOT NULL UNIQUE,
  slug        VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  sort_order  INT         NOT NULL DEFAULT 0
);

-- ── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL        PRIMARY KEY,
  name          VARCHAR(200)  NOT NULL,
  slug          VARCHAR(200)  NOT NULL UNIQUE,
  description   TEXT,
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  unit          VARCHAR(40)   NOT NULL DEFAULT 'per kg',
  category_id   INT           REFERENCES categories(id) ON DELETE SET NULL,
  image_url     TEXT,
  stock         INT           NOT NULL DEFAULT 0,
  is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
  is_featured   BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active   ON products(is_active);

-- ── Orders ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    VARCHAR(20)   NOT NULL UNIQUE,
  user_id         UUID          REFERENCES users(id) ON DELETE SET NULL,
  status          VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
    -- PENDING | CONFIRMED | IN_COLD_STORAGE | OUT_FOR_DELIVERY | DELIVERED | CANCELLED
  delivery_type   VARCHAR(20)   NOT NULL DEFAULT 'delivery',  -- delivery | pickup
  subtotal        NUMERIC(10,2) NOT NULL,
  tax             NUMERIC(10,2) NOT NULL,
  delivery_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL,
  payment_method  VARCHAR(30)   NOT NULL DEFAULT 'card',
  payment_status  VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    -- PENDING | PAID | FAILED | REFUNDED
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

-- ── Order Items ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL        PRIMARY KEY,
  order_id    UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INT           REFERENCES products(id) ON DELETE SET NULL,
  name        VARCHAR(200)  NOT NULL,  -- snapshot at time of order
  price       NUMERIC(10,2) NOT NULL,
  unit        VARCHAR(40)   NOT NULL DEFAULT 'per kg',
  quantity    INT           NOT NULL CHECK (quantity > 0),
  subtotal    NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ── Delivery Addresses ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id          SERIAL       PRIMARY KEY,
  order_id    UUID         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  firstname   VARCHAR(80)  NOT NULL,
  lastname    VARCHAR(80)  NOT NULL,
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(30)  NOT NULL,
  address     TEXT,
  suburb      VARCHAR(100),
  city        VARCHAR(100) NOT NULL DEFAULT 'Windhoek',
  notes       TEXT
);

-- ── Wholesale Quotes ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wholesale_quotes (
  id                SERIAL       PRIMARY KEY,
  business_name     VARCHAR(200) NOT NULL,
  contact_person    VARCHAR(160) NOT NULL,
  email             VARCHAR(255) NOT NULL,
  phone             VARCHAR(30)  NOT NULL,
  business_type     VARCHAR(50),
  delivery_location VARCHAR(200),
  product_interests TEXT,
  additional_info   TEXT,
  status            VARCHAR(20)  NOT NULL DEFAULT 'NEW',  -- NEW | CONTACTED | QUOTED | CLOSED
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Contact Messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         SERIAL       PRIMARY KEY,
  name       VARCHAR(160) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  phone      VARCHAR(30),
  subject    VARCHAR(255),
  message    TEXT         NOT NULL,
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── updated_at trigger ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations…');
    await client.query(SQL);
    console.log('✅ Migrations complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
