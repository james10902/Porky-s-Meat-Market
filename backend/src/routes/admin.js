/**
 * Admin routes — /api/admin
 * All routes require authentication + admin role.
 *
 * GET  /dashboard          Summary stats
 * GET  /users              List all users
 * GET  /users/:id          Single user
 * PATCH /users/:id/role    Change user role
 * PATCH /users/:id/active  Toggle user active status
 * GET  /contact            Contact messages
 * PATCH /contact/:id/read  Mark message as read
 * GET  /wholesale          Wholesale quote requests
 * PATCH /wholesale/:id/status  Update quote status
 */
const router = require('express').Router();
const { query } = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// All admin routes require auth + admin role
router.use(authenticate, requireAdmin);

/* ── GET /api/admin/dashboard ───────────────────────────────────────────── */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      ordersRes,
      revenueRes,
      usersRes,
      productsRes,
      recentOrdersRes,
      statusBreakdownRes
    ] = await Promise.all([
      query(`SELECT COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE status = 'PENDING')          AS pending,
                    COUNT(*) FILTER (WHERE status = 'CONFIRMED')        AS confirmed,
                    COUNT(*) FILTER (WHERE status = 'OUT_FOR_DELIVERY') AS out_for_delivery,
                    COUNT(*) FILTER (WHERE status = 'DELIVERED')        AS delivered,
                    COUNT(*) FILTER (WHERE status = 'CANCELLED')        AS cancelled
             FROM orders`),

      query(`SELECT COALESCE(SUM(total), 0) AS total_revenue,
                    COALESCE(SUM(total) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'), 0) AS revenue_30d,
                    COALESCE(SUM(total) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),  0) AS revenue_7d
             FROM orders
             WHERE status != 'CANCELLED'`),

      query(`SELECT COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_30d
             FROM users`),

      query(`SELECT COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE stock = 0)    AS out_of_stock,
                    COUNT(*) FILTER (WHERE stock < 10)   AS low_stock
             FROM products WHERE is_active = TRUE`),

      query(`SELECT o.id, o.order_number, o.status, o.total, o.created_at,
                    u.firstname, u.lastname, u.email
             FROM orders o
             LEFT JOIN users u ON u.id = o.user_id
             ORDER BY o.created_at DESC
             LIMIT 10`),

      query(`SELECT status, COUNT(*) AS count
             FROM orders
             GROUP BY status
             ORDER BY count DESC`)
    ]);

    res.json({
      orders:         ordersRes.rows[0],
      revenue:        revenueRes.rows[0],
      users:          usersRes.rows[0],
      products:       productsRes.rows[0],
      recent_orders:  recentOrdersRes.rows,
      status_breakdown: statusBreakdownRes.rows
    });
  } catch (err) {
    console.error('Admin dashboard error:', err.message);
    res.status(500).json({ error: 'Could not fetch dashboard stats.' });
  }
});

/* ── GET /api/admin/users ────────────────────────────────────────────────── */
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);
    const offset   = (pageNum - 1) * limitNum;

    const params = [];
    let where = '';
    if (search) {
      params.push('%' + search.toLowerCase() + '%');
      where = `WHERE LOWER(email) LIKE $1 OR LOWER(firstname) LIKE $1 OR LOWER(lastname) LIKE $1`;
    }

    params.push(limitNum, offset);
    const result = await query(
      `SELECT id, firstname, lastname, email, phone, role, is_active, created_at,
              (SELECT COUNT(*) FROM orders WHERE user_id = users.id) AS order_count
       FROM users
       ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = search ? ['%' + search.toLowerCase() + '%'] : [];
    const countWhere  = search ? `WHERE LOWER(email) LIKE $1 OR LOWER(firstname) LIKE $1 OR LOWER(lastname) LIKE $1` : '';
    const countRes    = await query(`SELECT COUNT(*) FROM users ${countWhere}`, countParams);

    res.json({
      users: result.rows,
      pagination: {
        total: parseInt(countRes.rows[0].count, 10),
        page:  pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error('Admin users error:', err.message);
    res.status(500).json({ error: 'Could not fetch users.' });
  }
});

/* ── GET /api/admin/users/:id ────────────────────────────────────────────── */
router.get('/users/:id', async (req, res) => {
  try {
    const userRes = await query(
      `SELECT id, firstname, lastname, email, phone, role, is_active, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'User not found.' });

    const ordersRes = await query(
      `SELECT id, order_number, status, total, created_at
       FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.params.id]
    );

    res.json({ ...userRes.rows[0], orders: ordersRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch user.' });
  }
});

/* ── PATCH /api/admin/users/:id/role ─────────────────────────────────────── */
router.patch('/users/:id/role',
  [body('role').isIn(['customer', 'admin', 'wholesale']).withMessage('Invalid role.')],
  validate,
  async (req, res) => {
    try {
      const result = await query(
        `UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role`,
        [req.body.role, req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Could not update role.' });
    }
  }
);

/* ── PATCH /api/admin/users/:id/active ───────────────────────────────────── */
router.patch('/users/:id/active',
  [body('is_active').isBoolean()],
  validate,
  async (req, res) => {
    try {
      const result = await query(
        `UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, is_active`,
        [req.body.is_active, req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Could not update user status.' });
    }
  }
);

/* ── GET /api/admin/contact ──────────────────────────────────────────────── */
router.get('/contact', async (req, res) => {
  try {
    const { page = 1, limit = 20, unread } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);
    const offset   = (pageNum - 1) * limitNum;

    const params = [];
    let where = '';
    if (unread === 'true') {
      where = 'WHERE is_read = FALSE';
    }

    params.push(limitNum, offset);
    const result = await query(
      `SELECT * FROM contact_messages ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countRes = await query(
      `SELECT COUNT(*) FROM contact_messages ${where}`,
      []
    );

    res.json({
      messages: result.rows,
      pagination: {
        total: parseInt(countRes.rows[0].count, 10),
        page:  pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch messages.' });
  }
});

/* ── PATCH /api/admin/contact/:id/read ───────────────────────────────────── */
router.patch('/contact/:id/read', async (req, res) => {
  try {
    const result = await query(
      `UPDATE contact_messages SET is_read = TRUE WHERE id = $1 RETURNING id, is_read`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Message not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not update message.' });
  }
});

/* ── GET /api/admin/wholesale ────────────────────────────────────────────── */
router.get('/wholesale', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum  = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);
    const offset   = (pageNum - 1) * limitNum;

    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = `WHERE status = $${params.length}`;
    }

    params.push(limitNum, offset);
    const result = await query(
      `SELECT * FROM wholesale_quotes ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = status ? [status] : [];
    const countWhere  = status ? 'WHERE status = $1' : '';
    const countRes    = await query(`SELECT COUNT(*) FROM wholesale_quotes ${countWhere}`, countParams);

    res.json({
      quotes: result.rows,
      pagination: {
        total: parseInt(countRes.rows[0].count, 10),
        page:  pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch quotes.' });
  }
});

/* ── PATCH /api/admin/wholesale/:id/status ───────────────────────────────── */
router.patch('/wholesale/:id/status',
  [body('status').isIn(['NEW', 'CONTACTED', 'QUOTED', 'CLOSED']).withMessage('Invalid status.')],
  validate,
  async (req, res) => {
    try {
      const result = await query(
        `UPDATE wholesale_quotes SET status = $1 WHERE id = $2 RETURNING id, business_name, status`,
        [req.body.status, req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Quote not found.' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Could not update quote status.' });
    }
  }
);

module.exports = router;
