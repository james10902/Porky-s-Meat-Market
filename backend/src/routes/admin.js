import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * GET /api/admin/dashboard
 * Get admin dashboard metrics
 */
router.get('/dashboard', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Admin dashboard endpoint will be implemented in task 10.12'
  });
}));

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Get users endpoint will be implemented in task 10.10'
  });
}));

/**
 * PUT /api/admin/users/:id
 * Update user
 */
router.put('/users/:id', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Update user endpoint will be implemented in task 10.11'
  });
}));

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/users/:id', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Delete user endpoint will be implemented in task 10.11'
  });
}));

export default router;
