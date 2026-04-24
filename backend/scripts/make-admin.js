/**
 * Promote a user to admin role
 * Usage: node scripts/make-admin.js email@example.com
 */
require('dotenv').config();
const { Pool } = require('pg');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/make-admin.js your@email.com');
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: 5432,
  database: process.env.DB_NAME || 'porkys_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD
});

pool.query(
  `UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, firstname, lastname, email, role`,
  [email.toLowerCase()]
).then(result => {
  if (!result.rows.length) {
    console.error('No user found with email:', email);
    console.error('Register an account first at http://localhost:5500/pages/login.html');
  } else {
    const u = result.rows[0];
    console.log('✅ Admin role granted to:', u.firstname, u.lastname, '(' + u.email + ')');
    console.log('   They can now access: http://localhost:5500/pages/admin.html');
  }
  pool.end();
}).catch(err => {
  console.error('Error:', err.message);
  pool.end();
});
