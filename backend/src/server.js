/**
 * Porky's Meat Market — Express API Server
 */
require('dotenv').config();

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');
const compression = require('compression');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Security & Middleware ───────────────────────────────────────────────── */
app.use(helmet({
  contentSecurityPolicy: false  // Disable for dev; configure properly in production
}));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5500')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Rate limiting ───────────────────────────────────────────────────────── */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message: { error: 'Too many authentication attempts. Please try again later.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

/* ── Routes ──────────────────────────────────────────────────────────────── */
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/contact',  require('./routes/contact'));
app.use('/api/admin',    require('./routes/admin'));

/* ── Health check ────────────────────────────────────────────────────────── */
app.get('/api/health', async (req, res) => {
  try {
    const { query } = require('./db/pool');
    await query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', error: err.message });
  }
});

/* ── Serve static frontend (production) ─────────────────────────────────── */
if (process.env.NODE_ENV === 'production') {
  const root = path.join(__dirname, '../../');
  app.use(express.static(root));
  // SPA fallback — serve index.html for unknown routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found.' });
    res.sendFile(path.join(root, 'index.html'));
  });
}

/* ── 404 for unknown API routes ─────────────────────────────────────────── */
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

/* ── Global error handler ────────────────────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message
  });
});

/* ── Start ───────────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n🥩  Porky's Meat Market API`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
