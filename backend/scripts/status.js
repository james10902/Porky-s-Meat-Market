/**
 * Full website status audit
 * Tests every layer: DB tables, API endpoints, auth flow, order flow
 */
const BASE = 'http://localhost:3000/api';
const ts   = Date.now();
const testEmail = 'status_' + ts + '@porkysmm.test';
let token, productId, orderId;
let pass = 0, fail = 0;

async function req(method, path, body, auth) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = 'Bearer ' + auth;
  try {
    const res  = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data, ok: res.ok };
  } catch (e) {
    return { status: 0, data: {}, ok: false, err: e.message };
  }
}

function ok(label, detail) {
  pass++;
  console.log('  ✅  ' + label + (detail ? '  →  ' + detail : ''));
}
function ko(label, detail) {
  fail++;
  console.error('  ❌  ' + label + (detail ? '  →  ' + detail : ''));
}
function section(title) {
  console.log('\n── ' + title + ' ' + '─'.repeat(Math.max(0, 44 - title.length)));
}

async function run() {
  console.log('\n🔍  PORKY\'S MEAT MARKET — FULL STATUS AUDIT');
  console.log('═'.repeat(50));

  // ── 1. API Server ──────────────────────────────────
  section('1. API SERVER');
  const h = await req('GET', '/health');
  if (h.ok && h.data.status === 'ok' && h.data.db === 'connected') {
    ok('Express server running', 'http://localhost:3000');
    ok('PostgreSQL connected', h.data.db);
  } else {
    ko('API server / DB', JSON.stringify(h.data));
  }

  // ── 2. Database tables ─────────────────────────────
  section('2. DATABASE TABLES');
  const { Pool } = require('pg');
  require('dotenv').config();
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost', port: 5432,
    database: process.env.DB_NAME || 'porkys_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
  });
  try {
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name`);
    const names = tables.rows.map(r => r.table_name);
    const required = ['categories','contact_messages','delivery_addresses','order_items','orders','products','users','wholesale_quotes'];
    required.forEach(t => names.includes(t) ? ok('Table: ' + t) : ko('Missing table: ' + t));

    const counts = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM categories) AS cats,
        (SELECT COUNT(*) FROM products)   AS prods,
        (SELECT COUNT(*) FROM users)      AS users,
        (SELECT COUNT(*) FROM orders)     AS orders,
        (SELECT COUNT(*) FROM contact_messages) AS contacts,
        (SELECT COUNT(*) FROM wholesale_quotes) AS quotes`);
    const c = counts.rows[0];
    ok('Seed data', c.cats + ' categories, ' + c.prods + ' products, ' + c.users + ' users, ' + c.orders + ' orders');
  } catch (e) {
    ko('Database query', e.message);
  } finally {
    await pool.end();
  }

  // ── 3. Products API ────────────────────────────────
  section('3. PRODUCTS API');
  const pAll = await req('GET', '/products?limit=14');
  if (pAll.ok && pAll.data.products) {
    ok('GET /products', pAll.data.pagination.total + ' products in DB');
    productId = pAll.data.products[0]?.id;
  } else ko('GET /products', JSON.stringify(pAll.data));

  const pFeat = await req('GET', '/products/featured');
  pFeat.ok && pFeat.data.length > 0
    ? ok('GET /products/featured', pFeat.data.length + ' featured items')
    : ko('GET /products/featured', JSON.stringify(pFeat.data));

  const pCats = await req('GET', '/products/categories');
  pCats.ok && pCats.data.length > 0
    ? ok('GET /products/categories', pCats.data.map(c => c.name).join(', '))
    : ko('GET /products/categories');

  const pSearch = await req('GET', '/products?search=chicken');
  pSearch.ok
    ? ok('GET /products?search=chicken', (pSearch.data.products || []).length + ' results')
    : ko('Search filter');

  const pFilter = await req('GET', '/products?category=beef&sort=price-low');
  pFilter.ok
    ? ok('GET /products?category=beef&sort=price-low', (pFilter.data.products || []).length + ' results')
    : ko('Category + sort filter');

  if (productId) {
    const pOne = await req('GET', '/products/' + productId);
    pOne.ok ? ok('GET /products/:id', pOne.data.name + ' @ N$' + pOne.data.price) : ko('GET /products/:id');
  }

  // ── 4. Authentication ──────────────────────────────
  section('4. AUTHENTICATION');
  const reg = await req('POST', '/auth/register', {
    firstname: 'Status', lastname: 'Check', email: testEmail, password: 'StatusCheck123!'
  });
  if (reg.status === 201 && reg.data.token) {
    token = reg.data.token;
    ok('POST /auth/register', 'JWT issued, user ID: ' + reg.data.user.id);
  } else ko('POST /auth/register', JSON.stringify(reg.data));

  const login = await req('POST', '/auth/login', { email: testEmail, password: 'StatusCheck123!' });
  if (login.ok && login.data.token) {
    token = login.data.token;
    ok('POST /auth/login', 'JWT refreshed');
  } else ko('POST /auth/login', JSON.stringify(login.data));

  const me = await req('GET', '/auth/me', null, token);
  me.ok ? ok('GET /auth/me', me.data.firstname + ' ' + me.data.lastname + ' (' + me.data.role + ')') : ko('GET /auth/me');

  const badLogin = await req('POST', '/auth/login', { email: testEmail, password: 'wrongpassword' });
  badLogin.status === 401 ? ok('Auth rejects wrong password', '401 returned') : ko('Auth security check');

  const noToken = await req('GET', '/auth/me');
  noToken.status === 401 ? ok('Protected routes require JWT', '401 without token') : ko('JWT protection');

  // ── 5. Orders ──────────────────────────────────────
  section('5. ORDERS');
  const order = await req('POST', '/orders', {
    items: [{ product_id: productId, quantity: 1 }],
    delivery_type: 'pickup',
    payment_method: 'cod',
    delivery: { firstname: 'Status', lastname: 'Check', email: testEmail, phone: '+264 61 000 000' }
  }, token);
  if (order.status === 201 && order.data.order_number) {
    orderId = order.data.id;
    ok('POST /orders', order.data.order_number + ' — total N$' + order.data.total + ' (server-calculated)');
  } else ko('POST /orders', JSON.stringify(order.data));

  const myOrders = await req('GET', '/orders', null, token);
  myOrders.ok && myOrders.data.length > 0
    ? ok('GET /orders', myOrders.data.length + ' order(s) for this user')
    : ko('GET /orders', JSON.stringify(myOrders.data));

  if (orderId) {
    const detail = await req('GET', '/orders/' + orderId, null, token);
    detail.ok && detail.data.items
      ? ok('GET /orders/:id', detail.data.items.length + ' line item(s)')
      : ko('GET /orders/:id');

    const tracking = await req('GET', '/orders/' + orderId + '/tracking', null, token);
    tracking.ok && tracking.data.steps
      ? ok('GET /orders/:id/tracking', tracking.data.steps.length + ' steps, status=' + tracking.data.order.status)
      : ko('GET /orders/:id/tracking');

    const cancel = await req('PATCH', '/orders/' + orderId + '/cancel', {}, token);
    cancel.ok && cancel.data.status === 'CANCELLED'
      ? ok('PATCH /orders/:id/cancel', 'Order cancelled')
      : ko('PATCH /orders/:id/cancel');
  }

  const noAuth = await req('POST', '/orders', { items: [] });
  noAuth.status === 401 ? ok('Orders require auth', '401 without token') : ko('Order auth protection');

  // ── 6. Contact & Wholesale ─────────────────────────
  section('6. CONTACT & WHOLESALE');
  const contact = await req('POST', '/contact', {
    name: 'Status Check', email: testEmail, subject: 'Test', message: 'Automated status check message.'
  });
  contact.status === 201 ? ok('POST /contact', 'Message saved to DB') : ko('POST /contact', JSON.stringify(contact.data));

  const wholesale = await req('POST', '/contact/wholesale', {
    business_name: 'Status Biz', contact_person: 'Status Check', email: testEmail,
    phone: '+264 61 000 000', business_type: 'hawker',
    delivery_location: 'Windhoek', product_interests: 'Beef, chicken'
  });
  wholesale.status === 201 ? ok('POST /contact/wholesale', 'Quote saved to DB') : ko('POST /contact/wholesale');

  // ── 7. Admin ───────────────────────────────────────
  section('7. ADMIN ENDPOINTS');
  const adminDash = await req('GET', '/admin/dashboard', null, token);
  adminDash.status === 403 ? ok('Admin routes protected', '403 for non-admin') : ko('Admin protection');

  // ── 8. Frontend files ──────────────────────────────
  section('8. FRONTEND FILES');
  const fs   = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..', '..');
  const pages = [
    'index.html', '404.html',
    'pages/login.html', 'pages/products.html', 'pages/heritage.html',
    'pages/wholesale.html', 'pages/contact.html', 'pages/dashboard.html', 'pages/checkout.html'
  ];
  const jsModules = [
    'js/services/api.js', 'js/utils/dom.js',
    'js/modules/auth.js', 'js/modules/authPage.js', 'js/modules/authGate.js',
    'js/modules/cart.js', 'js/modules/cartDrawer.js', 'js/modules/checkout.js',
    'js/modules/home.js', 'js/modules/products.js', 'js/modules/dashboard.js',
    'js/modules/nav.js', 'js/modules/theme.js', 'js/modules/contact.js',
    'js/modules/wholesale.js', 'js/modules/heritage.js'
  ];
  const cssFiles = [
    'css/design-system.css', 'css/components.css', 'css/footer.css',
    'css/pages/home.css', 'css/pages/products.css', 'css/pages/checkout.css',
    'css/pages/login.css', 'css/pages/dashboard.css', 'css/pages/contact.css',
    'css/pages/heritage.css', 'css/pages/wholesale.css'
  ];

  let missingFiles = [];
  [...pages, ...jsModules, ...cssFiles].forEach(f => {
    if (!fs.existsSync(path.join(root, f))) missingFiles.push(f);
  });

  if (missingFiles.length === 0) {
    ok('All HTML pages present', pages.length + ' pages');
    ok('All JS modules present', jsModules.length + ' modules');
    ok('All CSS files present', cssFiles.length + ' stylesheets');
  } else {
    missingFiles.forEach(f => ko('Missing file: ' + f));
  }

  // ── 9. Frontend → API connection ──────────────────
  section('9. FRONTEND → API CONNECTION');
  const apiJs = fs.readFileSync(path.join(root, 'js/services/api.js'), 'utf8');
  apiJs.includes('localhost:3000')
    ? ok('api.js points to localhost:3000 in dev')
    : ko('api.js baseURL not configured');
  apiJs.includes('Bearer')
    ? ok('JWT Authorization header implemented')
    : ko('JWT header missing');

  const checkoutJs = fs.readFileSync(path.join(root, 'js/modules/checkout.js'), 'utf8');
  checkoutJs.includes('API.orders.create')
    ? ok('checkout.js calls real API')
    : ko('checkout.js not wired to API');

  const homeJs = fs.readFileSync(path.join(root, 'js/modules/home.js'), 'utf8');
  homeJs.includes('API.products.getFeatured')
    ? ok('home.js loads featured products from API')
    : ko('home.js not wired to API');

  const productsJs = fs.readFileSync(path.join(root, 'js/modules/products.js'), 'utf8');
  productsJs.includes('API.products.getAll')
    ? ok('products.js loads catalogue from API')
    : ko('products.js not wired to API');

  const authJs = fs.readFileSync(path.join(root, 'js/modules/auth.js'), 'utf8');
  authJs.includes('API.auth.register') && authJs.includes('API.auth.login')
    ? ok('auth.js uses real API with localStorage fallback')
    : ko('auth.js not wired to API');

  const dashJs = fs.readFileSync(path.join(root, 'js/modules/dashboard.js'), 'utf8');
  dashJs.includes('API.orders.getAll')
    ? ok('dashboard.js loads real orders from API')
    : ko('dashboard.js not wired to API');

  // ── Summary ────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  const total = pass + fail;
  if (fail === 0) {
    console.log('  ✅  ALL ' + total + ' CHECKS PASSED');
    console.log('  🟢  Website is FULLY FUNCTIONAL');
  } else {
    console.log('  ✅  ' + pass + '/' + total + ' checks passed');
    console.log('  🔴  ' + fail + ' issue(s) need attention');
  }
  console.log('═'.repeat(50));

  console.log('\n  HOW TO USE:');
  console.log('  • API:      http://localhost:3000/api/health');
  console.log('  • Frontend: Open index.html with Live Server (VS Code)');
  console.log('  • The frontend auto-connects to the API at localhost:3000\n');

  process.exit(fail > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('\n❌ Audit error:', err.message);
  process.exit(1);
});
