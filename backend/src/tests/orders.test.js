/**
 * Orders route tests
 */
const request = require('supertest');
const app     = require('../server');

const email    = `orders_${Date.now()}@porkysmm.test`;
const password = 'TestPass123!';
let token;
let orderId;

beforeAll(async () => {
  // Register and login
  const reg = await request(app)
    .post('/api/auth/register')
    .send({ firstname: 'Order', lastname: 'Tester', email, password });
  token = reg.body.token;
});

describe('POST /api/orders', () => {
  it('requires authentication', async () => {
    const res = await request(app).post('/api/orders').send({});
    expect(res.status).toBe(401);
  });

  it('rejects empty items array', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [],
        delivery_type: 'delivery',
        payment_method: 'card',
        delivery: { email, phone: '+264 61 000 000' }
      });
    expect(res.status).toBe(422);
  });

  it('rejects invalid delivery_type', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ product_id: 1, quantity: 1 }],
        delivery_type: 'teleport',
        payment_method: 'card',
        delivery: { email, phone: '+264 61 000 000' }
      });
    expect(res.status).toBe(422);
  });

  it('places a valid order', async () => {
    // Get a real product id first
    const prodRes = await request(app).get('/api/products?limit=1');
    const product = prodRes.body.products[0];
    if (!product) return; // skip if no products seeded

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ product_id: product.id, quantity: 1 }],
        delivery_type: 'pickup',
        payment_method: 'cod',
        delivery: {
          firstname: 'Order',
          lastname:  'Tester',
          email,
          phone: '+264 61 000 000'
        }
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('order_number');
    expect(res.body.status).toBe('PENDING');
    expect(res.body.delivery_fee).toBe(0); // pickup = free
    orderId = res.body.id;
  });
});

describe('GET /api/orders', () => {
  it('returns my orders', async () => {
    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders/:id', () => {
  it('returns order detail', async () => {
    if (!orderId) return;
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
    expect(Array.isArray(res.body.items)).toBe(true);
  });
});

describe('GET /api/orders/:id/tracking', () => {
  it('returns tracking steps', async () => {
    if (!orderId) return;
    const res = await request(app)
      .get(`/api/orders/${orderId}/tracking`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('order');
    expect(Array.isArray(res.body.steps)).toBe(true);
    expect(res.body.steps.length).toBe(5);
    // First step (PENDING) should be completed
    expect(res.body.steps[0].completed).toBe(true);
  });
});

describe('PATCH /api/orders/:id/cancel', () => {
  it('cancels a PENDING order', async () => {
    if (!orderId) return;
    const res = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CANCELLED');
  });

  it('cannot cancel an already-cancelled order', async () => {
    if (!orderId) return;
    const res = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});
