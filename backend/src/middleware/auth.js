import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */

export const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : req.cookies?.token;
    
    if (!token) {
      throw new AppError('No authentication token provided', 401);
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Invalid authentication token'
      });
    }
    
    res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Authentication failed'
    });
  }
};

/**
 * Authorization Middleware
 * Checks if user has required role
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }
    
    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : req.cookies?.token;
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
  }
  
  next();
};
