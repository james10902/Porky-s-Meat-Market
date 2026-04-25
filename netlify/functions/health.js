/**
 * Health check function
 */
const { query } = require('./db');
const { createResponse } = require('./middleware');

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }

  if (event.httpMethod !== 'GET') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  try {
    await query('SELECT 1');
    return createResponse(200, { 
      status: 'ok', 
      db: 'connected', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (err) {
    return createResponse(503, { 
      status: 'error', 
      db: 'disconnected', 
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
};