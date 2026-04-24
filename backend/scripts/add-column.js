require('dotenv').config();
const { Pool } = require('pg');
const p = new Pool({
  host: process.env.DB_HOST, port: 5432,
  database: process.env.DB_NAME, user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});
p.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE')
  .then(() => { console.log('Column is_hidden added to orders'); p.end(); })
  .catch(e => { console.error(e.message); p.end(); });
