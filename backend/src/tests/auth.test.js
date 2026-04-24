/**
 * Auth route tests
 * Run: npm test
 */
const request = require('supertest');
const app     = require('../server');

// Unique email per test run to avoid conflicts
const email    = `test_${Date.now()}@porkysmm.test`;
const password = 'TestPass123!';
let token;

describe('POST /api/auth/register', () => {
  it('creates a new user and returns a JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstname: 'Test', lastname: 'User', email, password });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(email);
    expect(res.body.user).not.toHaveProperty('password_hash');
    token = res.body.token;
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstname: 'Test', lastname: 'User', email, password });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects short password with 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ firstname: 'A', lastname: 'B', email: 'new@test.com', password: 'short' });

    expect(res.status).toBe(422);
  });

  it('rejects missing fields with 422', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@x.com' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/auth/login', () => {
  it('returns JWT for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('rejects unknown email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/auth/profile', () => {
  it('updates profile fields', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+264 61 000 000' });

    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('+264 61 000 000');
  });
});
