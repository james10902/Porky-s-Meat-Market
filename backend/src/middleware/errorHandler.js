/**
 * Global error handling middleware
 * Catches all errors and returns consistent error responses
 */
export const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log error details
  console.error({
    timestamp: new Date().toISOString(),
    status,
    message,
    path: req.path,
    method: req.method,
    stack: err.stack
  });
  
  // Send error response
  res.status(status).json({
    error: {
      status,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error wrapper for route handlers
 * Catches errors in async functions and passes to error handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Custom error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
