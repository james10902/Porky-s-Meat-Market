import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'User registration endpoint will be implemented in task 3.2'
  });
}));

/**
 * POST /api/auth/login
 * Login user and return JWT token
 */
router.post('/login', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'User login endpoint will be implemented in task 3.3'
  });
}));

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'User logout endpoint will be implemented in task 3.11'
  });
}));

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Get current user endpoint will be implemented in task 3.3'
  });
}));

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Token refresh endpoint will be implemented in task 3.12'
  });
}));

export default router;
