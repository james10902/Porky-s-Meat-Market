/**
 * Input Sanitization Middleware
 * Sanitizes all user inputs to prevent XSS and injection attacks
 */

/**
 * Sanitize a string by removing potentially malicious code
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

/**
 * Middleware to sanitize all inputs
 */
export const sanitizeInputs = (req, res, next) => {
  // Sanitize query parameters
  if (req.query && Object.keys(req.query).length > 0) {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize request body
  if (req.body && Object.keys(req.body).length > 0) {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize URL parameters
  if (req.params && Object.keys(req.params).length > 0) {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

export { sanitizeString, sanitizeObject };
