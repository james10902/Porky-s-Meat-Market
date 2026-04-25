/**
 * Auth function - handles /api/auth/*
 */
const { query } = require('./db');
const { signToken, authenticate, createResponse } = require('./middleware');
const bcrypt = require('bcryptjs');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }

  // Extract path after /api/auth
  const fullPath = event.path;
  let path = '';
  
  if (fullPath.includes('/api/auth')) {
    path = fullPath.replace('/api/auth', '');
  } else if (fullPath.includes('/.netlify/functions/auth')) {
    path = fullPath.replace('/.netlify/functions/auth', '');
  }
  
  try {
    // Route based on path and method
    if (event.httpMethod === 'POST' && path === '/register') {
      return await handleRegister(event);
    } else if (event.httpMethod === 'POST' && path === '/login') {
      return await handleLogin(event);
    } else if (event.httpMethod === 'GET' && path === '/me') {
      return await handleGetMe(event);
    } else if (event.httpMethod === 'PUT' && path === '/profile') {
      return await handleUpdateProfile(event);
    } else if (event.httpMethod === 'POST' && path === '/change-password') {
      return await handleChangePassword(event);
    } else {
      return createResponse(404, { error: 'Endpoint not found' });
    }
  } catch (error) {
    console.error('Auth function error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

/**
 * POST /register
 */
async function handleRegister(event) {
  const { firstname, lastname, email, password, phone } = JSON.parse(event.body || '{}');
  
  // Basic validation
  if (!firstname || !lastname || !email || !password) {
    return createResponse(400, { error: 'Missing required fields' });
  }

  try {
    // Check duplicate
    const exists = await query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length) {
      return createResponse(409, { error: 'An account with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      `INSERT INTO users (firstname, lastname, email, phone, password_hash)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, firstname, lastname, email, phone, role`,
      [firstname, lastname, email, phone || null, hash]
    );
    
    const user = result.rows[0];
    const token = signToken(user);
    return createResponse(201, { token, user });
  } catch (err) {
    console.error('Register error:', err.message);
    return createResponse(500, { error: 'Registration failed. Please try again.' });
  }
}

/**
 * POST /login
 */
async function handleLogin(event) {
  const { email, password } = JSON.parse(event.body || '{}');
  
  if (!email || !password) {
    return createResponse(400, { error: 'Email and password required' });
  }

  try {
    const result = await query(
      'SELECT id, firstname, lastname, email, phone, role, password_hash, is_active FROM users WHERE email=$1',
      [email]
    );
    const user = result.rows[0];

    if (!user || !user.is_active) {
      return createResponse(401, { error: 'Incorrect email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return createResponse(401, { error: 'Incorrect email or password.' });
    }

    const { password_hash, ...safeUser } = user;
    const token = signToken(safeUser);
    return createResponse(200, { token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err.message);
    return createResponse(500, { error: 'Login failed. Please try again.' });
  }
}

/**
 * GET /me
 */
async function handleGetMe(event) {
  const authResult = await authenticate(event);
  if (authResult.error) {
    return createResponse(authResult.status, { error: authResult.error });
  }

  try {
    const result = await query(
      'SELECT id, firstname, lastname, email, phone, role, created_at FROM users WHERE id=$1',
      [authResult.user.id]
    );
    
    if (!result.rows.length) {
      return createResponse(404, { error: 'User not found.' });
    }
    
    return createResponse(200, result.rows[0]);
  } catch (err) {
    return createResponse(500, { error: 'Could not fetch profile.' });
  }
}

/**
 * PUT /profile
 */
async function handleUpdateProfile(event) {
  const authResult = await authenticate(event);
  if (authResult.error) {
    return createResponse(authResult.status, { error: authResult.error });
  }

  const { firstname, lastname, phone } = JSON.parse(event.body || '{}');
  
  try {
    const result = await query(
      `UPDATE users SET
         firstname = COALESCE($1, firstname),
         lastname  = COALESCE($2, lastname),
         phone     = COALESCE($3, phone)
       WHERE id=$4
       RETURNING id, firstname, lastname, email, phone, role`,
      [firstname || null, lastname || null, phone || null, authResult.user.id]
    );
    
    return createResponse(200, result.rows[0]);
  } catch (err) {
    return createResponse(500, { error: 'Profile update failed.' });
  }
}

/**
 * POST /change-password
 */
async function handleChangePassword(event) {
  const authResult = await authenticate(event);
  if (authResult.error) {
    return createResponse(authResult.status, { error: authResult.error });
  }

  const { currentPassword, newPassword } = JSON.parse(event.body || '{}');
  
  if (!currentPassword || !newPassword) {
    return createResponse(400, { error: 'Current and new password required' });
  }

  if (newPassword.length < 8) {
    return createResponse(400, { error: 'New password must be at least 8 characters.' });
  }

  try {
    const result = await query('SELECT password_hash FROM users WHERE id=$1', [authResult.user.id]);
    const user = result.rows[0];
    
    if (!user) {
      return createResponse(404, { error: 'User not found.' });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return createResponse(401, { error: 'Current password is incorrect.' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, authResult.user.id]);
    
    return createResponse(200, { message: 'Password updated successfully.' });
  } catch (err) {
    return createResponse(500, { error: 'Password change failed.' });
  }
}