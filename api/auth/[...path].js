const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, ssl: { rejectUnauthorized: false } });
  return pool;
}

const JWT_SECRET = process.env.JWT_SECRET || 'porkys-secret-change-me';
const sign = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const auth = async (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try { return jwt.verify(header.split(' ')[1], JWT_SECRET); } catch { return null; }
};

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = (req.query.path || []).join('/');

  try {
    // POST /auth/register
    if (req.method === 'POST' && path === 'register') {
      const { firstname, lastname, email, phone, password } = req.body;
      if (!firstname || !lastname || !email || !password) return res.status(400).json({ error: 'Missing required fields' });
      const exists = await getPool().query('SELECT id FROM users WHERE email=$1', [email]);
      if (exists.rows.length) return res.status(409).json({ error: 'An account with this email already exists.' });
      const hash = await bcrypt.hash(password, 12);
      const result = await getPool().query(
        'INSERT INTO users (firstname,lastname,email,phone,password_hash) VALUES ($1,$2,$3,$4,$5) RETURNING id,firstname,lastname,email,phone,role',
        [firstname, lastname, email, phone || null, hash]
      );
      const user = result.rows[0];
      return res.status(201).json({ token: sign(user), user });
    }

    // POST /auth/login
    if (req.method === 'POST' && path === 'login') {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
      const result = await getPool().query(
        'SELECT id,firstname,lastname,email,phone,role,password_hash,is_active FROM users WHERE email=$1', [email]
      );
      const user = result.rows[0];
      if (!user || !user.is_active) return res.status(401).json({ error: 'Incorrect email or password.' });
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ error: 'Incorrect email or password.' });
      const { password_hash, ...safe } = user;
      return res.json({ token: sign(safe), user: safe });
    }

    // GET /auth/me
    if (req.method === 'GET' && path === 'me') {
      const user = await auth(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const result = await getPool().query('SELECT id,firstname,lastname,email,phone,role FROM users WHERE id=$1', [user.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
      return res.json(result.rows[0]);
    }

    // PUT /auth/profile
    if (req.method === 'PUT' && path === 'profile') {
      const user = await auth(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const { firstname, lastname, phone } = req.body;
      const result = await getPool().query(
        'UPDATE users SET firstname=COALESCE($1,firstname),lastname=COALESCE($2,lastname),phone=COALESCE($3,phone) WHERE id=$4 RETURNING id,firstname,lastname,email,phone,role',
        [firstname || null, lastname || null, phone || null, user.id]
      );
      return res.json(result.rows[0]);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
