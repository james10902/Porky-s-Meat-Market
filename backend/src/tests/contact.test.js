/**
 * Contact & Wholesale route tests
 */
const request = require('supertest');
const app     = require('../server');

describe('POST /api/contact', () => {
  it('saves a contact message', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name:    'Test User',
        email:   'test@example.com',
        subject: 'Test enquiry',
        message: 'This is a test message with enough characters.'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message');
  });

  it('rejects missing name', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ email: 'test@example.com', message: 'Hello there, this is a test.' });

    expect(res.status).toBe(422);
  });

  it('rejects invalid email', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Test', email: 'not-an-email', message: 'Hello there, this is a test.' });

    expect(res.status).toBe(422);
  });

  it('rejects short message', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Test', email: 'test@example.com', message: 'Hi' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/contact/wholesale', () => {
  it('saves a wholesale quote request', async () => {
    const res = await request(app)
      .post('/api/contact/wholesale')
      .send({
        business_name:     'Test Business',
        contact_person:    'Jane Doe',
        email:             'jane@testbiz.com',
        phone:             '+264 61 000 000',
        business_type:     'hawker',
        delivery_location: 'Windhoek',
        product_interests: 'Beef mince, chicken portions, polony'
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('Jane Doe');
  });

  it('rejects missing required fields', async () => {
    const res = await request(app)
      .post('/api/contact/wholesale')
      .send({ business_name: 'Test' });

    expect(res.status).toBe(422);
  });
});
