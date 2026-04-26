/**
 * PostgreSQL connection for Netlify Functions
 * Uses connection pooling optimized for serverless
 */
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('[DB] DATABASE_URL environment variable is not set!');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };