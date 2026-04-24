/**
 * Orders routes — /api/orders
 *
 * POST /                  Place a new order
 * GET  /                  My orders (authenticated user)
 * GET  /admin/all         All orders (admin)
 * GET  /:id               Single order detail
 * GET  /:id/tracking      Order tracking steps
 * PATCH /:id/cancel       Cancel an order (owner only, PENDING/CONFIRMED)
 * PATCH /:id/status       Update order status (admin)
 *
 * NOTE: Static sub-paths (/admin/all) MUST be registered before /:id
 */
const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const { query, pool } = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

/* ── helpers ─────────────────────────────────────────────────────────────── */
const genOrderNumber = () =>
  'PMM-' + Date.now().toString(36).toUpperCase().slice(-6);

const STATUS_FLOW = [
  'PENDING',
  'CONFIRMED',
  'IN_COLD_STORAGE',
  'OUT_FOR_DELIVERY',
  'DELIVERED'
];

const STATUS_LABELS = {
  PENDING:          'Order Placed',
  CONFIRMED:        'Confirmed',
  IN_COLD_STORAGE:  'In Cold Storage',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED:        'Delivered',
  CANCELLED:        'Cancelled'
};

/* ── POST /api/orders ────────────────────────────────────────────────────── */
router.post('/',
  authenticate,
  [
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item.'),
    body('items.*.product_id').isInt({ min: 1 }).withMessage('Invalid product ID.'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1.'),
    body('delivery_type').isIn(['delivery', 'pickup']).withMessage('delivery_type must be delivery or pickup.'),
    body('payment_method').isIn(['card', 'eft', 'mobile', 'cod']).withMessage('Invalid payment method.'),
    body('delivery.email').isEmail().withMessage('Valid delivery email required.'),
    body('delivery.phone').notEmpty().withMessage('Delivery phone is required.')
  ],
  validate,
  async (req, res) => {
    const { items, delivery_type, payment_method, delivery, notes, card_last4 } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const ids     = [...new Set(items.map(i => i.product_id))];
      const prodRes = await client.query(
        `SELECT id, name, price, unit, stock FROM products WHERE id = ANY($1::int[]) AND is_active = TRUE`,
        [ids]
      );

      const prodMap = {};
      prodRes.rows.forEach(p => { prodMap[p.id] = p; });

      for (const item of items) {
        const p = prodMap[item.product_id];
        if (!p) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Product ID ${item.product_id} not found or unavailable.` });
        }
        if (p.stock < item.quantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Insufficient stock for "${p.name}". Available: ${p.stock}, requested: ${item.quantity}.`
          });
        }
      }

      const subtotal     = items.reduce((s, i) => s + (Number(prodMap[i.product_id].price) * i.quantity), 0);
      const tax          = parseFloat((subtotal * 0.15).toFixed(2));
      const delivery_fee = delivery_type === 'pickup' ? 0 : 50;
      const total        = parseFloat((subtotal + tax + delivery_fee).toFixed(2));

      // Determine initial payment_status based on method
      // card → PAID (simulated instant approval)
      // cod/pickup → PENDING (pay on delivery)
      // eft/mobile → AWAITING (waiting for manual payment)
      const paymentStatusMap = { card: 'PAID', cod: 'PENDING', eft: 'AWAITING', mobile: 'AWAITING' };
      const payment_status   = paymentStatusMap[payment_method] || 'PENDING';
      // Card orders go straight to CONFIRMED; others stay PENDING until payment confirmed
      const order_status     = payment_method === 'card' ? 'CONFIRMED' : 'PENDING';

      const orderId     = uuidv4();
      const orderNumber = genOrderNumber();

      await client.query(
        `INSERT INTO orders
           (id, order_number, user_id, status, delivery_type,
            subtotal, tax, delivery_fee, total, payment_method, payment_status, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [orderId, orderNumber, req.user.id, order_status, delivery_type,
         subtotal, tax, delivery_fee, total, payment_method, payment_status, notes || null]
      );

      for (const item of items) {
        const p         = prodMap[item.product_id];
        const lineTotal = parseFloat((Number(p.price) * item.quantity).toFixed(2));
        await client.query(
          `INSERT INTO order_items (order_id, product_id, name, price, unit, quantity, subtotal)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [orderId, p.id, p.name, p.price, p.unit, item.quantity, lineTotal]
        );
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, p.id]);
      }

      if (delivery) {
        await client.query(
          `INSERT INTO delivery_addresses (order_id, firstname, lastname, email, phone, address, suburb, city, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [orderId, delivery.firstname || '', delivery.lastname || '', delivery.email, delivery.phone,
           delivery.address || null, delivery.suburb || null, delivery.city || 'Windhoek', delivery.notes || null]
        );
      }

      await client.query('COMMIT');

      res.status(201).json({
        id:             orderId,
        order_number:   orderNumber,
        status:         order_status,
        payment_status,
        subtotal,
        tax,
        delivery_fee,
        total,
        payment_method,
        message: payment_method === 'card'
          ? 'Payment approved. Your order is confirmed!'
          : payment_method === 'cod'
          ? 'Order placed. Pay on delivery.'
          : 'Order placed. Awaiting payment confirmation.'
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Order create error:', err.message);
      res.status(500).json({ error: 'Could not place order. Please try again.' });
    } finally {
      client.release();
    }
  }
);

/* ── GET /api/orders/admin/all (admin) ──────────────────────────────────── */
// MUST be before /:id
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum  = Math.max(1, parseInt(page,  10) || 1);
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);
    const offset   = (pageNum - 1) * limitNum;

    const params = [];
    let where = '';
    if (status) {
      params.push(status);
      where = `WHERE o.status = $${params.length}`;
    }

    params.push(limitNum, offset);

    const result = await query(
      `SELECT o.*,
              u.firstname, u.lastname, u.email AS user_email,
              (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Total count
    const countParams = status ? [status] : [];
    const countWhere  = status ? 'WHERE status = $1' : '';
    const countRes    = await query(`SELECT COUNT(*) FROM orders ${countWhere}`, countParams);

    res.json({
      orders: result.rows,
      pagination: {
        total: parseInt(countRes.rows[0].count, 10),
        page:  pageNum,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error('Admin orders error:', err.message);
    res.status(500).json({ error: 'Could not fetch orders.' });
  }
});

/* ── GET /api/orders (my orders) ────────────────────────────────────────── */
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT o.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id',       oi.id,
                    'name',     oi.name,
                    'price',    oi.price,
                    'unit',     oi.unit,
                    'quantity', oi.quantity,
                    'subtotal', oi.subtotal
                  )
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
              ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.user_id = $1 AND (o.is_hidden IS NULL OR o.is_hidden = FALSE)
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    // If is_hidden column doesn't exist yet, run without it
    if (err.code === '42703') {
      const result = await query(
        `SELECT o.*,
                COALESCE(json_agg(json_build_object('id',oi.id,'name',oi.name,'price',oi.price,'unit',oi.unit,'quantity',oi.quantity,'subtotal',oi.subtotal)) FILTER (WHERE oi.id IS NOT NULL),'[]') AS items
         FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
         WHERE o.user_id = $1 GROUP BY o.id ORDER BY o.created_at DESC`,
        [req.user.id]
      );
      return res.json(result.rows);
    }
    console.error('My orders error:', err.message);
    res.status(500).json({ error: 'Could not fetch orders.' });
  }
});

/* ── GET /api/orders/:id/tracking ───────────────────────────────────────── */
// MUST be before /:id
router.get('/:id/tracking', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, order_number, status, delivery_type, created_at, updated_at
       FROM orders
       WHERE id = $1 AND (user_id = $2 OR $3 = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found.' });

    const order      = result.rows[0];
    const currentIdx = STATUS_FLOW.indexOf(order.status);

    const steps = STATUS_FLOW.map((s, i) => ({
      status:    s,
      label:     STATUS_LABELS[s] || s,
      completed: i <= currentIdx
    }));

    res.json({ order, steps });
  } catch (err) {
    console.error('Tracking error:', err.message);
    res.status(500).json({ error: 'Could not fetch tracking.' });
  }
});

/* ── GET /api/orders/:id ─────────────────────────────────────────────────── */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const orderRes = await query(
      `SELECT o.*,
              da.firstname    AS d_firstname,
              da.lastname     AS d_lastname,
              da.email        AS d_email,
              da.phone        AS d_phone,
              da.address      AS d_address,
              da.suburb       AS d_suburb,
              da.city         AS d_city,
              da.notes        AS d_notes
       FROM orders o
       LEFT JOIN delivery_addresses da ON da.order_id = o.id
       WHERE o.id = $1 AND (o.user_id = $2 OR $3 = 'admin')`,
      [req.params.id, req.user.id, req.user.role]
    );
    if (!orderRes.rows.length) return res.status(404).json({ error: 'Order not found.' });

    const itemsRes = await query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
      [req.params.id]
    );

    res.json({ ...orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    console.error('Order detail error:', err.message);
    res.status(500).json({ error: 'Could not fetch order.' });
  }
});

/* ── DELETE /api/orders/:id (user deletes from their history) ───────────── */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Only allow deleting DELIVERED or CANCELLED orders from history view
    const result = await query(
      `UPDATE orders SET is_hidden = TRUE
       WHERE id = $1 AND user_id = $2 AND status IN ('DELIVERED', 'CANCELLED')
       RETURNING id, order_number`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(400).json({ error: 'Only completed or cancelled orders can be removed from history.' });
    }
    res.json({ message: 'Order removed from history.', id: result.rows[0].id });
  } catch (err) {
    // is_hidden column may not exist yet — add it gracefully
    if (err.code === '42703') {
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE`);
      return res.status(400).json({ error: 'Please try again.' });
    }
    console.error('Delete order error:', err.message);
    res.status(500).json({ error: 'Could not remove order.' });
  }
});

/* ── DELETE /api/orders (clear all history) ─────────────────────────────── */
router.delete('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `UPDATE orders SET is_hidden = TRUE
       WHERE user_id = $1 AND status IN ('DELIVERED', 'CANCELLED')
       RETURNING id`,
      [req.user.id]
    );
    res.json({ message: result.rows.length + ' order(s) removed from history.' });
  } catch (err) {
    if (err.code === '42703') {
      await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE`);
      return res.json({ message: '0 orders removed.' });
    }
    res.status(500).json({ error: 'Could not clear history.' });
  }
});
router.patch('/:id/cancel', authenticate, async (req, res) => {
  try {
    const result = await query(
      `UPDATE orders
       SET status = 'CANCELLED'
       WHERE id = $1
         AND user_id = $2
         AND status IN ('PENDING', 'CONFIRMED')
       RETURNING id, order_number, status`,
      [req.params.id, req.user.id]
    );
    if (!result.rows.length) {
      return res.status(400).json({
        error: 'Order cannot be cancelled. It may already be in progress or not belong to you.'
      });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Cancel order error:', err.message);
    res.status(500).json({ error: 'Could not cancel order.' });
  }
});

/* ── PATCH /api/orders/:id/status (admin) ───────────────────────────────── */
router.patch('/:id/status',
  authenticate, requireAdmin,
  [
    body('status')
      .isIn([...STATUS_FLOW, 'CANCELLED'])
      .withMessage('Invalid status value.')
  ],
  validate,
  async (req, res) => {
    try {
      const result = await query(
        `UPDATE orders
         SET status = $1
         WHERE id = $2
         RETURNING id, order_number, status, updated_at`,
        [req.body.status, req.params.id]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Order not found.' });
      res.json(result.rows[0]);
    } catch (err) {
      console.error('Status update error:', err.message);
      res.status(500).json({ error: 'Could not update order status.' });
    }
  }
);

module.exports = router;
