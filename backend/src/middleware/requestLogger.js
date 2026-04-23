/**
 * Request logging middleware
 * Logs all incoming requests with method, path, and response time
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`→ ${req.method} ${req.path}`);
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Color code based on status
    let statusColor = '\x1b[32m'; // green
    if (status >= 400 && status < 500) statusColor = '\x1b[33m'; // yellow
    if (status >= 500) statusColor = '\x1b[31m'; // red
    
    console.log(`← ${statusColor}${status}\x1b[0m ${req.method} ${req.path} (${duration}ms)`);
    
    return originalSend.call(this, data);
  };
  
  next();
};
