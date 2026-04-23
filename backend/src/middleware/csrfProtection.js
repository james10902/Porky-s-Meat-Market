import crypto from 'crypto';

/**
 * CSRF Protection Middleware
 * Generates CSRF tokens and validates them on state-changing requests
 */

// Store tokens in memory (in production, use Redis or database)
const csrfTokens = new Map();

/**
 * Generate a new CSRF token
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF protection middleware
 * Validates CSRF tokens on POST, PUT, DELETE requests
 */
export const csrfProtection = (req, res, next) => {
  // Generate token for GET requests
  if (req.method === 'GET') {
    const token = generateCSRFToken();
    csrfTokens.set(token, Date.now());
    res.locals.csrfToken = token;
    return next();
  }
  
  // Validate token on state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body.csrfToken;
    
    if (!token) {
      return res.status(403).json({
        error: 'CSRF token missing',
        message: 'CSRF token is required for this request'
      });
    }
    
    if (!csrfTokens.has(token)) {
      return res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'CSRF token is invalid or expired'
      });
    }
    
    // Remove used token
    csrfTokens.delete(token);
  }
  
  next();
};

/**
 * Middleware to attach CSRF token to response
 */
export const attachCSRFToken = (req, res, next) => {
  const token = generateCSRFToken();
  csrfTokens.set(token, Date.now());
  res.locals.csrfToken = token;
  next();
};

/**
 * Clean up expired tokens (run periodically)
 */
export const cleanupExpiredTokens = () => {
  const now = Date.now();
  const maxAge = 3600000; // 1 hour
  
  for (const [token, timestamp] of csrfTokens.entries()) {
    if (now - timestamp > maxAge) {
      csrfTokens.delete(token);
    }
  }
};

// Run cleanup every 30 minutes
setInterval(cleanupExpiredTokens, 1800000);
