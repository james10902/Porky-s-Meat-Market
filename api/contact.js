const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, ssl: { rejectUnauthorized: false } });
  return pool;
}

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

module.exports = async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'Name, email and message are required' });

  try {
    const result = await getPool().query(
      'INSERT INTO contact_messages (name,email,phone,subject,message) VALUES ($1,$2,$3,$4,$5) RETURNING id,created_at',
      [name, email, phone || null, subject || null, message]
    );
    return res.status(201).json({ message: 'Message sent successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('Contact error:', err.message);
    return res.status(500).json({ error: 'Failed to send message' });
  }
};
