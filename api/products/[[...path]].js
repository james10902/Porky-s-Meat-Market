const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, ssl: { rejectUnauthorized: false } });
  return pool;
}

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const segments = req.query.path || [];
  const path = segments.join('/');

  try {
    // GET /products/categories
    if (path === 'categories') {
      const result = await getPool().query(
        "SELECT DISTINCT category_slug as slug, category_name as name, COUNT(*) as product_count FROM products WHERE is_active=true GROUP BY category_slug,category_name ORDER BY category_name"
      );
      return res.json(result.rows);
    }

    // GET /products/featured
    if (path === 'featured') {
      const result = await getPool().query(
        'SELECT * FROM products WHERE featured=true AND is_active=true ORDER BY created_at DESC LIMIT 8'
      );
      return res.json(result.rows);
    }

    // GET /products/:id
    if (path && !isNaN(path)) {
      const result = await getPool().query('SELECT * FROM products WHERE id=$1 AND is_active=true', [path]);
      if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
      return res.json(result.rows[0]);
    }

    // GET /products
    const { category, search, sort, page = 1, limit = 12 } = req.query;
    let sql = 'SELECT * FROM products WHERE is_active=true';
    const params = [];

    if (category) { params.push(category); sql += ` AND category_slug=$${params.length}`; }
    if (search)   { params.push(`%${search}%`); sql += ` AND (name ILIKE $${params.length} OR description ILIKE $${params.length})`; }

    if (sort === 'price-low')  sql += ' ORDER BY price ASC';
    else if (sort === 'price-high') sql += ' ORDER BY price DESC';
    else sql += ' ORDER BY name ASC';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit)); sql += ` LIMIT $${params.length}`;
    params.push(offset);          sql += ` OFFSET $${params.length}`;

    const result = await getPool().query(sql, params);

    // Count total
    let countSql = 'SELECT COUNT(*) FROM products WHERE is_active=true';
    const countParams = [];
    if (category) { countParams.push(category); countSql += ` AND category_slug=$${countParams.length}`; }
    if (search)   { countParams.push(`%${search}%`); countSql += ` AND (name ILIKE $${countParams.length} OR description ILIKE $${countParams.length})`; }
    const countResult = await getPool().query(countSql, countParams);
    const total = parseInt(countResult.rows[0].count);

    return res.json({
      products: result.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });

  } catch (err) {
    console.error('Products error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
