/**
 * Porky's Meat Market — Database Setup Script
 * Runs: create DB → migrate → seed → verify
 *
 * Usage:
 *   node scripts/setup.js                          (uses .env password)
 *   node scripts/setup.js --password=yourpassword  (override password)
 */
require('dotenv').config();
const { Client, Pool } = require('pg');

// Allow password override via CLI arg
const args = process.argv.slice(2);
const pwArg = args.find(a => a.startsWith('--password='));
if (pwArg) process.env.DB_PASSWORD = pwArg.split('=')[1];

const DB_NAME = process.env.DB_NAME || 'porkys_db';
const baseConfig = {
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  user:     process.env.DB_USER || 'postgres',
  connectionTimeoutMillis: 4000
};

async function tryConnect(password) {
  const client = new Client({ ...baseConfig, password, database: 'postgres' });
  try {
    await client.connect();
    return client;
  } catch (err) {
    try { await client.end(); } catch (_) {}
    return null;
  }
}

async function run() {
  console.log('\n🥩  Porky\'s Meat Market — Database Setup');
  console.log('─'.repeat(50));
  console.log(`   Host:     ${baseConfig.host}:${baseConfig.port}`);
  console.log(`   User:     ${baseConfig.user}`);
  console.log(`   Database: ${DB_NAME}`);
  console.log('─'.repeat(50));

  // ── Step 1: Find working password ───────────────────
  console.log('\n[1/4] Connecting to PostgreSQL…');

  const envPassword = process.env.DB_PASSWORD || '';
  const candidates  = [envPassword, 'postgres', 'admin', 'password', 'root', '12345', ''];
  // Deduplicate
  const passwords   = [...new Set(candidates)];

  let adminClient = null;
  let workingPassword = null;

  for (const pw of passwords) {
    process.stdout.write(`      Trying password "${pw || '(empty)'}"… `);
    adminClient = await tryConnect(pw);
    if (adminClient) {
      workingPassword = pw;
      console.log('✅');
      break;
    }
    console.log('✗');
  }

  if (!adminClient) {
    console.error('\n      ❌ Could not connect with any common password.');
    console.error('\n   To fix this:');
    console.error('   1. Find your PostgreSQL password (set during installation)');
    console.error('   2. Run: node scripts/setup.js --password=YOUR_PASSWORD');
    console.error('   3. Or see backend/CONNECT.md for more options');
    process.exit(1);
  }

  // Update .env with working password
  if (workingPassword !== envPassword) {
    console.log(`\n      ℹ️  Updating .env with working password: "${workingPassword}"`);
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/^DB_PASSWORD=.*/m, `DB_PASSWORD=${workingPassword}`);
    fs.writeFileSync(envPath, envContent);
    process.env.DB_PASSWORD = workingPassword;
  }

  // ── Step 2: Create database ──────────────────────────
  console.log(`\n[2/4] Creating database "${DB_NAME}"…`);
  try {
    const exists = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]
    );
    if (exists.rows.length > 0) {
      console.log(`      ✅ Database "${DB_NAME}" already exists`);
    } else {
      await adminClient.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`      ✅ Database "${DB_NAME}" created`);
    }
  } catch (err) {
    console.error('      ❌ Failed to create database:', err.message);
    await adminClient.end();
    process.exit(1);
  }
  await adminClient.end();

  // ── Step 3: Run migrations ───────────────────────────
  console.log('\n[3/4] Running migrations (creating tables)…');

  const pool = new Pool({
    ...baseConfig,
    password: workingPassword,
    database: DB_NAME,
    max: 3
  });

  const migrationSQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  firstname     VARCHAR(80) NOT NULL,
  lastname      VARCHAR(80) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  phone         VARCHAR(30),
  password_hash TEXT        NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'customer',
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL      PRIMARY KEY,
  name        VARCHAR(80) NOT NULL UNIQUE,
  slug        VARCHAR(80) NOT NULL UNIQUE,
  description TEXT,
  sort_order  INT         NOT NULL DEFAULT 0
);

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

CREATE TABLE IF NOT EXISTS orders (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number    VARCHAR(20)   NOT NULL UNIQUE,
  user_id         UUID          REFERENCES users(id) ON DELETE SET NULL,
  status          VARCHAR(30)   NOT NULL DEFAULT 'PENDING',
  delivery_type   VARCHAR(20)   NOT NULL DEFAULT 'delivery',
  subtotal        NUMERIC(10,2) NOT NULL,
  tax             NUMERIC(10,2) NOT NULL,
  delivery_fee    NUMERIC(10,2) NOT NULL DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL,
  payment_method  VARCHAR(30)   NOT NULL DEFAULT 'card',
  payment_status  VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL        PRIMARY KEY,
  order_id    UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INT           REFERENCES products(id) ON DELETE SET NULL,
  name        VARCHAR(200)  NOT NULL,
  price       NUMERIC(10,2) NOT NULL,
  unit        VARCHAR(40)   NOT NULL DEFAULT 'per kg',
  quantity    INT           NOT NULL CHECK (quantity > 0),
  subtotal    NUMERIC(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

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
  status            VARCHAR(20)  NOT NULL DEFAULT 'NEW',
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

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

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
`;

  const migClient = await pool.connect();
  try {
    await migClient.query(migrationSQL);
    console.log('      ✅ All 8 tables created');
  } catch (err) {
    console.error('      ❌ Migration failed:', err.message);
    migClient.release();
    await pool.end();
    process.exit(1);
  }
  migClient.release();

  // ── Step 4: Seed ─────────────────────────────────────
  console.log('\n[4/4] Seeding categories and products…');

  const categories = [
    { name: 'Beef',      slug: 'beef',      description: 'Fresh beef cuts and mince',    sort_order: 1 },
    { name: 'Pork',      slug: 'pork',      description: 'Pork chops and cuts',          sort_order: 2 },
    { name: 'Chicken',   slug: 'chicken',   description: 'Whole and portioned chicken',  sort_order: 3 },
    { name: 'Processed', slug: 'processed', description: 'Polony, wors and dried meats', sort_order: 4 },
    { name: 'Game',      slug: 'game',      description: 'Namibian game meat',           sort_order: 5 },
    { name: 'Bulk',      slug: 'bulk',      description: 'Value bulk packs',             sort_order: 6 }
  ];

  const products = [
    { name: 'Beef Mince & Wors',        slug: 'beef-mince-wors',        price: 119.99, unit: 'per kg',       cat: 'beef',      img: '/assets/Images/Beef mince and Beef wors.jpg', desc: 'Fresh beef mince and traditional boerewors — a braai essential.',  featured: true,  stock: 100 },
    { name: 'Beef Stew',                slug: 'beef-stew',              price: 109.99, unit: 'per kg',       cat: 'beef',      img: '/assets/Images/Beef Stew.jpg',                desc: 'Tender beef stew cuts, perfect for slow-cooking.',                 featured: false, stock: 80  },
    { name: 'Big Polonies',             slug: 'big-polonies',           price: 54.99,  unit: 'per kg',       cat: 'processed', img: '/assets/Images/Big polonies.jpg',             desc: 'Classic large polony — a Namibian lunchbox staple.',               featured: false, stock: 200 },
    { name: 'Mini Polony',              slug: 'mini-polony',            price: 49.99,  unit: 'per kg',       cat: 'processed', img: '/assets/Images/Mini Polony.jpg',              desc: 'Convenient mini polony portions for everyday use.',                featured: false, stock: 200 },
    { name: 'Chicken Breast (Bone-in)', slug: 'chicken-breast-bone-in', price: 74.99,  unit: 'per kg',       cat: 'chicken',   img: '/assets/Images/Chicken Breast Bone.jpg',      desc: 'Juicy bone-in chicken breast, great for grilling or roasting.',    featured: false, stock: 150 },
    { name: 'Chicken Feet',             slug: 'chicken-feet',           price: 29.99,  unit: 'per kg',       cat: 'chicken',   img: '/assets/Images/Chicken Feet.jpg',             desc: 'Fresh chicken feet — popular for soups and stews.',                featured: false, stock: 120 },
    { name: 'Chicken Leg Quarters',     slug: 'chicken-leg-quarters',   price: 64.99,  unit: 'per kg',       cat: 'chicken',   img: '/assets/Images/Chicken Leg Quatres.jpg',      desc: 'Meaty chicken leg quarters, ideal for braai or oven.',             featured: false, stock: 150 },
    { name: 'Chicken Liver',            slug: 'chicken-liver',          price: 34.99,  unit: 'per kg',       cat: 'chicken',   img: '/assets/Images/Chicken Liver.jpg',            desc: 'Fresh chicken livers, rich in flavour and nutrients.',             featured: false, stock: 100 },
    { name: 'Chicken Necks',            slug: 'chicken-necks',          price: 24.99,  unit: 'per kg',       cat: 'chicken',   img: '/assets/Images/Chicken Necks.jpg',            desc: 'Chicken necks — perfect for stocks, soups, and braai.',            featured: false, stock: 100 },
    { name: 'Chicken Soup Pack',        slug: 'chicken-soup-pack',      price: 44.99,  unit: 'per pack',     cat: 'chicken',   img: '/assets/Images/Chicken Soup Pack.jpg',        desc: 'All-in-one chicken soup pack with mixed cuts.',                    featured: false, stock: 80  },
    { name: 'Droewors',                 slug: 'droewors',               price: 189.99, unit: 'per kg',       cat: 'processed', img: '/assets/Images/Droewors.jpg',                 desc: 'Traditional dried wors — a Namibian snack favourite.',             featured: true,  stock: 60  },
    { name: 'Game Stew',                slug: 'game-stew',              price: 149.99, unit: 'per kg',       cat: 'game',      img: '/assets/Images/Game stew.jpg',                desc: 'Premium Namibian game stew cuts — wild and flavourful.',           featured: true,  stock: 50  },
    { name: 'Pork Shoulder Chops',      slug: 'pork-shoulder-chops',    price: 89.99,  unit: 'per kg',       cat: 'pork',      img: '/assets/Images/Pork Shoulder Chops.jpg',      desc: 'Thick-cut pork shoulder chops, great for braai or pan-fry.',       featured: true,  stock: 90  },
    { name: 'Bulk Meat Pack',           slug: 'bulk-meat-pack',         price: 549.99, unit: 'per 5 kg box', cat: 'bulk',      img: '/assets/Images/product-bulk.jpg',             desc: 'Value bulk pack — mixed cuts for households and hawkers.',         featured: false, stock: 40  }
  ];

  const seedClient = await pool.connect();
  try {
    const existing = await seedClient.query('SELECT COUNT(*) FROM products');
    if (parseInt(existing.rows[0].count, 10) > 0) {
      console.log('      ✅ Data already seeded — skipping');
    } else {
      await seedClient.query('BEGIN');
      const catMap = {};
      for (const cat of categories) {
        const r = await seedClient.query(
          `INSERT INTO categories (name, slug, description, sort_order)
           VALUES ($1,$2,$3,$4) ON CONFLICT (slug) DO UPDATE SET name=$1 RETURNING id`,
          [cat.name, cat.slug, cat.description, cat.sort_order]
        );
        catMap[cat.slug] = r.rows[0].id;
      }
      for (const p of products) {
        await seedClient.query(
          `INSERT INTO products (name, slug, description, price, unit, category_id, image_url, stock, is_featured)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (slug) DO NOTHING`,
          [p.name, p.slug, p.desc, p.price, p.unit, catMap[p.cat], p.img, p.stock, p.featured]
        );
      }
      await seedClient.query('COMMIT');
      console.log(`      ✅ Seeded ${categories.length} categories and ${products.length} products`);
    }
  } catch (err) {
    await seedClient.query('ROLLBACK').catch(() => {});
    console.error('      ❌ Seed failed:', err.message);
    seedClient.release();
    await pool.end();
    process.exit(1);
  }
  seedClient.release();

  // ── Verify ───────────────────────────────────────────
  const vc = await pool.connect();
  const counts = await vc.query(`
    SELECT
      (SELECT COUNT(*) FROM categories) AS categories,
      (SELECT COUNT(*) FROM products)   AS products,
      (SELECT COUNT(*) FROM users)      AS users,
      (SELECT COUNT(*) FROM orders)     AS orders
  `);
  vc.release();
  await pool.end();

  const c = counts.rows[0];
  console.log('\n' + '─'.repeat(50));
  console.log('   ✅  DATABASE READY');
  console.log(`   Categories: ${c.categories}  |  Products: ${c.products}  |  Users: ${c.users}  |  Orders: ${c.orders}`);
  console.log('─'.repeat(50));
  console.log('\n   Start the API server:');
  console.log('   cd backend && npm run dev');
  console.log('\n   API: http://localhost:3000');
  console.log('   Health: http://localhost:3000/api/health');
  console.log('   Products: http://localhost:3000/api/products\n');
}

run().catch(err => {
  console.error('\n❌ Unexpected error:', err.message);
  process.exit(1);
});
