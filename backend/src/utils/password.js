import bcrypt from 'bcryptjs';

/**
 * Password Utilities
 * Helper functions for password hashing and verification
 */

const SALT_ROUNDS = 10;

/**
 * Hash password
 */
export const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
};

/**
 * Verify password
 */
export const verifyPassword = async (password, hash) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error(`Password verification failed: ${error.message}`);
  }
};
