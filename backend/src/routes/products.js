import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/products
 * Get all products with filtering
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Get products endpoint will be implemented in task 4.2'
  });
}));

/**
 * GET /api/products/:id
 * Get single product by ID
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Get product by ID endpoint will be implemented in task 4.3'
  });
}));

/**
 * POST /api/products
 * Create new product (admin only)
 */
router.post('/', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Create product endpoint will be implemented in task 10.4'
  });
}));

/**
 * PUT /api/products/:id
 * Update product (admin only)
 */
router.put('/:id', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Update product endpoint will be implemented in task 10.5'
  });
}));

/**
 * DELETE /api/products/:id
 * Delete product (admin only)
 */
router.delete('/:id', asyncHandler(async (req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    message: 'Delete product endpoint will be implemented in task 10.6'
  });
}));

export default router;
