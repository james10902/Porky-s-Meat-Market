/**
 * Products route tests
 */
const request = require('supertest');
const app     = require('../server');

describe('GET /api/products', () => {
  it('returns paginated product list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(res.body).toHaveProperty('pagination');
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('filters by category slug', async () => {
    const res = await request(app).get('/api/products?category=beef');
    expect(res.status).toBe(200);
    res.body.products.forEach(p => {
      expect(p.category_slug).toBe('beef');
    });
  });

  it('filters by search term', async () => {
    const res = await request(app).get('/api/products?search=chicken');
    expect(res.status).toBe(200);
    res.body.products.forEach(p => {
      const haystack = (p.name + ' ' + (p.description || '')).toLowerCase();
      expect(haystack).toContain('chicken');
    });
  });

  it('sorts by price ascending', async () => {
    const res = await request(app).get('/api/products?sort=price-low&limit=100');
    expect(res.status).toBe(200);
    const prices = res.body.products.map(p => parseFloat(p.price));
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
    }
  });

  it('respects pagination limit', async () => {
    const res = await request(app).get('/api/products?limit=3');
    expect(res.status).toBe(200);
    expect(res.body.products.length).toBeLessThanOrEqual(3);
  });
});

describe('GET /api/products/featured', () => {
  it('returns featured products', async () => {
    const res = await request(app).get('/api/products/featured');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach(p => expect(p.is_featured).toBe(true));
  });
});

describe('GET /api/products/categories', () => {
  it('returns all categories with product counts', async () => {
    const res = await request(app).get('/api/products/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach(c => {
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('slug');
      expect(c).toHaveProperty('product_count');
    });
  });
});

describe('GET /api/products/:id', () => {
  it('returns a single product', async () => {
    // Get first product id
    const listRes = await request(app).get('/api/products?limit=1');
    const id = listRes.body.products[0]?.id;
    if (!id) return; // skip if no products seeded

    const res = await request(app).get(`/api/products/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/products/999999');
    expect(res.status).toBe(404);
  });

  it('returns 400 for non-numeric id', async () => {
    const res = await request(app).get('/api/products/not-a-number');
    expect(res.status).toBe(400);
  });
});
