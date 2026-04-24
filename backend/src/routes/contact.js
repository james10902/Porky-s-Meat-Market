/**
 * Contact & Wholesale routes — /api/contact, /api/wholesale
 */
const router = require('express').Router();
const { body } = require('express-validator');
const { query } = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

/* ── POST /api/contact ───────────────────────────────────────────────────── */
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('message').trim().isLength({ min: 10 }).withMessage('Message must be at least 10 characters.')
  ],
  validate,
  async (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    try {
      await query(
        `INSERT INTO contact_messages (name, email, phone, subject, message)
         VALUES ($1,$2,$3,$4,$5)`,
        [name, email, phone || null, subject || null, message]
      );
      res.status(201).json({ message: 'Message received. We\'ll get back to you shortly.' });
    } catch (err) {
      console.error('Contact save error:', err.message);
      res.status(500).json({ error: 'Could not save message. Please try again.' });
    }
  }
);

/* ── GET /api/contact (admin) ────────────────────────────────────────────── */
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch messages.' });
  }
});

/* ── POST /api/wholesale/quote ───────────────────────────────────────────── */
router.post('/wholesale',
  [
    body('business_name').trim().notEmpty(),
    body('contact_person').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('phone').trim().notEmpty(),
    body('business_type').trim().notEmpty(),
    body('delivery_location').trim().notEmpty(),
    body('product_interests').trim().isLength({ min: 5 })
  ],
  validate,
  async (req, res) => {
    const { business_name, contact_person, email, phone,
            business_type, delivery_location, product_interests, additional_info } = req.body;
    try {
      await query(
        `INSERT INTO wholesale_quotes
           (business_name, contact_person, email, phone, business_type, delivery_location, product_interests, additional_info)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [business_name, contact_person, email, phone,
         business_type, delivery_location, product_interests, additional_info || null]
      );
      res.status(201).json({
        message: `Thank you, ${contact_person}! Your quote request has been received. Our wholesale team will contact you within 24 hours.`
      });
    } catch (err) {
      console.error('Wholesale quote error:', err.message);
      res.status(500).json({ error: 'Could not save quote request. Please try again.' });
    }
  }
);

/* ── GET /api/wholesale/quotes (admin) ───────────────────────────────────── */
router.get('/wholesale', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM wholesale_quotes ORDER BY created_at DESC LIMIT 100'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch quotes.' });
  }
});

module.exports = router;
