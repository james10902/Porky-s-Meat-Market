/**
 * PostgreSQL connection for Netlify Functions
 * Uses connection pooling optimized for serverless
 */
const { Pool } = require('pg');

// Use environment variables from Netlify
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2, // Smaller pool for serverless
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err.message);
});

/**
 * Helper — run a parameterised query
 * @param {string} text   SQL string with $1, $2 … placeholders
 * @param {Array}  params Parameter values
 */
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };