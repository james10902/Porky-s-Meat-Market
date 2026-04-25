/**
 * Middleware utilities for Netlify Functions
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_long_random_secret_string';

/**
 * Sign JWT token
 */
const signToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Authenticate JWT token
 */
const authenticate = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 };
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { user: decoded };
  } catch (err) {
    return { error: 'Invalid token', status: 401 };
  }
};

/**
 * Validate request body
 */
const validate = (schema) => {
  return async (event) => {
    // For Netlify Functions, validation would be done in the handler
    // This is a simplified version
    return null; // No errors
  };
};

/**
 * CORS headers for Netlify Functions
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGINS || '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true'
};

/**
 * Create response object
 */
const createResponse = (statusCode, body, headers = {}) => {
  return {
    statusCode,
    headers: { ...corsHeaders, ...headers },
    body: JSON.stringify(body)
  };
};

module.exports = {
  signToken,
  authenticate,
  validate,
  corsHeaders,
  createResponse
};