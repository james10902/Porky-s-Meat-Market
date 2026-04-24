/**
 * Products routes — /api/products
 *
 * GET  /                  List products (filter, search, sort, paginate)
 * GET  /featured          Featured products
 * GET  /categories        All categories
 * GET  /:id               Single product
 * POST /                  Create product (admin)
 * PUT  /:id               Update product (admin)
 * DELETE /:id             Soft-delete product (admin)
 */
const router   = require('express').Router();
const { query } = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body }  = require('express-validator');
const validate  = require('../middleware/validate');

/* ── helpers ─────────────────────────────────────────────────────────────── */
const SORT_MAP = {
  name:         'p.name ASC',
  'price-low':  'p.price ASC',
  'price-high': 'p.price DESC',
  newest:       'p.created_at DESC',
  featured:     'p.is_featured DESC, p.name ASC'
};

/* ── GET /api/products/featured ─────────────────────────────────────────── */
// Must be registered BEFORE /:id to avoid "featured" being treated as an id
router.get('/featured', async (req, res) => {
  try {
    const result = await query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.is_active = TRUE AND p.is_featured = TRUE
       ORDER BY p.name
       LIMIT 8`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Featured products error:', err.message);
    res.status(500).json({ error: 'Could not fetch featured products.' });
  }
});

/* ── GET /api/products/categories ───────────────────────────────────────── */
router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      `SELECT c.*, COUNT(p.id) AS product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = TRUE
       GROUP BY c.id
       ORDER BY c.sort_order, c.name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Categories error:', err.message);
    res.status(500).json({ error: 'Could not fetch categories.' });
  }
});

/* ── GET /api/products ───────────────────────────────────────────────────── */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      search,
      sort  = 'name',
      page  = 1,
      limit = 20
    } = req.query;

    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset   = (pageNum - 1) * limitNum;

    const params = [];
    const where  = ['p.is_active = TRUE'];

    if (category) {
      params.push(category);
      where.push(`c.slug = $${params.length}`);
    }

    if (search && search.trim()) {
      // Use two separate params to avoid reusing the same $N
      const term = '%' + search.trim().toLowerCase() + '%';
      params.push(term);
      const n = params.length;
      params.push(term);
      where.push(`(LOWER(p.name) LIKE $${n} OR LOWER(p.description) LIKE $${n + 1})`);
    }

    const whereClause = 'WHERE ' + where.join(' AND ');
    const orderClause = 'ORDER BY ' + (SORT_MAP[sort] || SORT_MAP.name);

    const baseSql = `
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}`;

    // Total count (no ORDER BY, no LIMIT)
    const countRes = await query(`SELECT COUNT(*) ${baseSql}`, params);
    const total    = parseInt(countRes.rows[0].count, 10);

    // Paginated rows
    params.push(limitNum, offset);
    const dataRes = await query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       ${baseSql}
       ${orderClause}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      products: dataRes.rows,
      pagination: {
        total,
        page:  pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    console.error('Products list error:', err.message);
    res.status(500).json({ error: 'Could not fetch products.' });
  }
});

/* ── GET /api/products/:id ───────────────────────────────────────────────── */
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID.' });

  try {
    const result = await query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1 AND p.is_active = TRUE`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Product fetch error:', err.message);
    res.status(500).json({ error: 'Could not fetch product.' });
  }
});

/* ── POST /api/products (admin) ──────────────────────────────────────────── */
router.post('/',
  authenticate, requireAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
    body('category_id').isInt({ min: 1 }).withMessage('Valid category required.'),
    body('unit').optional().trim(),
    body('description').optional().trim(),
    body('stock').optional().isInt({ min: 0 }),
    body('is_featured').optional().isBoolean()
  ],
  validate,
  async (req, res) => {
    const { name, slug, description, price, unit, category_id,
            image_url, stock, is_featured } = req.body;
    const safeSlug = (slug || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    try {
      const result = await query(
        `INSERT INTO products
           (name, slug, description, price, unit, category_id, image_url, stock, is_featured)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING *`,
        [name, safeSlug, description || null, price,
         unit || 'per kg', category_id, image_url || null,
         stock ?? 0, is_featured ?? false]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'A product with this slug already exists.' });
      }
      console.error('Product create error:', err.message);
      res.status(500).json({ error: 'Could not create product.' });
    }
  }
);

/* ── PUT /api/products/:id (admin) ──────────────────────────────────────── */
router.put('/:id',
  authenticate, requireAdmin,
  async (req, res) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID.' });

    const allowed = ['name','description','price','unit','category_id',
                     'image_url','stock','is_featured','is_active'];
    const updates = [];
    const values  = [];

    allowed.forEach(f => {
      if (req.body[f] !== undefined) {
        values.push(req.body[f]);
        updates.push(`${f} = $${values.length}`);
      }
    });

    if (!updates.length) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }

    values.push(id);
    try {
      const result = await query(
        `UPDATE products SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING *`,
        values
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Product not found.' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Product update error:', err.message);
      res.status(500).json({ error: 'Could not update product.' });
    }
  }
);

/* ── DELETE /api/products/:id (admin — soft delete) ─────────────────────── */
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid product ID.' });

  try {
    const result = await query(
      `UPDATE products SET is_active = FALSE WHERE id = $1 RETURNING id, name`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: `Product "${result.rows[0].name}" deactivated.` });
  } catch (err) {
    console.error('Product delete error:', err.message);
    res.status(500).json({ error: 'Could not deactivate product.' });
  }
});

module.exports = router;
