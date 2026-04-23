import jwt from 'jsonwebtoken';

/**
 * JWT Utilities
 * Helper functions for JWT token generation and verification
 */

/**
 * Generate JWT token
 */
export const generateToken = (payload, expiresIn = process.env.JWT_EXPIRY || '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Decode JWT token without verification
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Create user token payload
 */
export const createUserPayload = (user) => {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
