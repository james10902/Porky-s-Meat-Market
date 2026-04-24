/**
 * PostgreSQL connection pool
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'porkys_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max:      10,
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 5000,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
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
