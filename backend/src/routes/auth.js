/**
 * Auth routes — /api/auth
 */
const router   = require('express').Router();
const bcrypt   = require('bcryptjs');
const { body } = require('express-validator');
const { query }      = require('../db/pool');
const { signToken }  = require('../middleware/auth');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

/* ── POST /api/auth/register ─────────────────────────────────────────────── */
router.post('/register',
  [
    body('firstname').trim().notEmpty().withMessage('First name is required.'),
    body('lastname').trim().notEmpty().withMessage('Last name is required.'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('phone').optional().trim()
  ],
  validate,
  async (req, res) => {
    const { firstname, lastname, email, password, phone } = req.body;
    try {
      // Check duplicate
      const exists = await query('SELECT id FROM users WHERE email=$1', [email]);
      if (exists.rows.length) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const hash = await bcrypt.hash(password, 12);
      const result = await query(
        `INSERT INTO users (firstname, lastname, email, phone, password_hash)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, firstname, lastname, email, phone, role`,
        [firstname, lastname, email, phone || null, hash]
      );
      const user  = result.rows[0];
      const token = signToken(user);
      res.status(201).json({ token, user });
    } catch (err) {
      console.error('Register error:', err.message);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
);

/* ── POST /api/auth/login ────────────────────────────────────────────────── */
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required.'),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await query(
        'SELECT id, firstname, lastname, email, phone, role, password_hash, is_active FROM users WHERE email=$1',
        [email]
      );
      const user = result.rows[0];

      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Incorrect email or password.' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ error: 'Incorrect email or password.' });
      }

      const { password_hash, ...safeUser } = user;
      const token = signToken(safeUser);
      res.json({ token, user: safeUser });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
);

/* ── GET /api/auth/me ────────────────────────────────────────────────────── */
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, firstname, lastname, email, phone, role, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch profile.' });
  }
});

/* ── PUT /api/auth/profile ───────────────────────────────────────────────── */
router.put('/profile', authenticate,
  [
    body('firstname').optional().trim().notEmpty(),
    body('lastname').optional().trim().notEmpty(),
    body('phone').optional().trim()
  ],
  validate,
  async (req, res) => {
    const { firstname, lastname, phone } = req.body;
    try {
      const result = await query(
        `UPDATE users SET
           firstname = COALESCE($1, firstname),
           lastname  = COALESCE($2, lastname),
           phone     = COALESCE($3, phone)
         WHERE id=$4
         RETURNING id, firstname, lastname, email, phone, role`,
        [firstname || null, lastname || null, phone || null, req.user.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: 'Profile update failed.' });
    }
  }
);

/* ── POST /api/auth/change-password ─────────────────────────────────────── */
router.post('/change-password', authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
  ],
  validate,
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
      const result = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
      const user   = result.rows[0];
      if (!user) return res.status(404).json({ error: 'User not found.' });

      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

      const hash = await bcrypt.hash(newPassword, 12);
      await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.user.id]);
      res.json({ message: 'Password updated successfully.' });
    } catch (err) {
      res.status(500).json({ error: 'Password change failed.' });
    }
  }
);

module.exports = router;
