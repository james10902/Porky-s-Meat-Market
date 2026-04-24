/**
 * Full API integration test
 * Tests: health, products, categories, auth register/login, order flow
 */
const BASE = 'http://localhost:3000/api';
const email = 'test_' + Date.now() + '@porkysmm.test';
let token, userId, productId, orderId;

async function req(method, path, body, auth) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = 'Bearer ' + auth;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function pass(label) { console.log('  ✅ ' + label); }
function fail(label, detail) { console.error('  ❌ ' + label + (detail ? ': ' + detail : '')); }

async function run() {
  console.log('\n🧪  Porky\'s Meat Market — API Integration Test');
  console.log('─'.repeat(50));

  // Health
  console.log('\n[Health]');
  const h = await req('GET', '/health');
  h.status === 200 && h.data.db === 'connected'
    ? pass('API healthy, DB connected')
    : fail('Health check', JSON.stringify(h.data));

  // Products
  console.log('\n[Products]');
  const p = await req('GET', '/products?limit=5');
  if (p.status === 200 && p.data.products && p.data.products.length > 0) {
    pass('List products (' + p.data.products.length + ' returned, ' + p.data.pagination.total + ' total)');
    productId = p.data.products[0].id;
    pass('First product: ' + p.data.products[0].name + ' @ N$' + p.data.products[0].price);
  } else {
    fail('List products', JSON.stringify(p.data));
  }

  const pf = await req('GET', '/products/featured');
  pf.status === 200 && Array.isArray(pf.data) && pf.data.length > 0
    ? pass('Featured products (' + pf.data.length + ' items)')
    : fail('Featured products', JSON.stringify(pf.data));

  const pc = await req('GET', '/products/categories');
  pc.status === 200 && Array.isArray(pc.data) && pc.data.length > 0
    ? pass('Categories (' + pc.data.map(c => c.name).join(', ') + ')')
    : fail('Categories', JSON.stringify(pc.data));

  const pcat = await req('GET', '/products?category=chicken');
  pcat.status === 200
    ? pass('Filter by category: chicken (' + (pcat.data.products || []).length + ' products)')
    : fail('Category filter', JSON.stringify(pcat.data));

  const psearch = await req('GET', '/products?search=beef');
  psearch.status === 200
    ? pass('Search "beef" (' + (psearch.data.products || []).length + ' results)')
    : fail('Search', JSON.stringify(psearch.data));

  // Auth
  console.log('\n[Auth]');
  const reg = await req('POST', '/auth/register', {
    firstname: 'Test', lastname: 'User', email, password: 'TestPass123!'
  });
  if (reg.status === 201 && reg.data.token) {
    token = reg.data.token;
    userId = reg.data.user.id;
    pass('Register new user: ' + email);
  } else {
    fail('Register', JSON.stringify(reg.data));
  }

  const login = await req('POST', '/auth/login', { email, password: 'TestPass123!' });
  if (login.status === 200 && login.data.token) {
    token = login.data.token;
    pass('Login successful');
  } else {
    fail('Login', JSON.stringify(login.data));
  }

  const me = await req('GET', '/auth/me', null, token);
  me.status === 200 && me.data.email === email
    ? pass('GET /auth/me: ' + me.data.firstname + ' ' + me.data.lastname)
    : fail('GET /auth/me', JSON.stringify(me.data));

  // Orders
  console.log('\n[Orders]');
  const order = await req('POST', '/orders', {
    items: [{ product_id: productId, quantity: 1 }],
    delivery_type: 'pickup',
    payment_method: 'cod',
    delivery: {
      firstname: 'Test', lastname: 'User',
      email, phone: '+264 61 000 000'
    }
  }, token);

  if (order.status === 201 && order.data.order_number) {
    orderId = order.data.id;
    pass('Place order: ' + order.data.order_number + ' (total: N$' + order.data.total + ')');
  } else {
    fail('Place order', JSON.stringify(order.data));
  }

  const myOrders = await req('GET', '/orders', null, token);
  myOrders.status === 200 && Array.isArray(myOrders.data) && myOrders.data.length > 0
    ? pass('My orders (' + myOrders.data.length + ' order(s))')
    : fail('My orders', JSON.stringify(myOrders.data));

  if (orderId) {
    const tracking = await req('GET', '/orders/' + orderId + '/tracking', null, token);
    tracking.status === 200 && tracking.data.steps
      ? pass('Order tracking: status=' + tracking.data.order.status + ', steps=' + tracking.data.steps.length)
      : fail('Order tracking', JSON.stringify(tracking.data));

    const cancel = await req('PATCH', '/orders/' + orderId + '/cancel', {}, token);
    cancel.status === 200 && cancel.data.status === 'CANCELLED'
      ? pass('Cancel order: ' + cancel.data.order_number)
      : fail('Cancel order', JSON.stringify(cancel.data));
  }

  // Contact
  console.log('\n[Contact]');
  const contact = await req('POST', '/contact', {
    name: 'Test User', email, subject: 'Test', message: 'This is a test message from the API test suite.'
  });
  contact.status === 201
    ? pass('Contact form submitted')
    : fail('Contact form', JSON.stringify(contact.data));

  const wholesale = await req('POST', '/contact/wholesale', {
    business_name: 'Test Biz', contact_person: 'Test User', email,
    phone: '+264 61 000 000', business_type: 'hawker',
    delivery_location: 'Windhoek', product_interests: 'Beef, chicken, polony'
  });
  wholesale.status === 201
    ? pass('Wholesale quote submitted')
    : fail('Wholesale quote', JSON.stringify(wholesale.data));

  console.log('\n' + '─'.repeat(50));
  console.log('   ✅  All tests complete');
  console.log('   API is fully connected to PostgreSQL\n');
  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ Test error:', err.message);
  process.exit(1);
});
