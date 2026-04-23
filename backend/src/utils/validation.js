/**
 * Validation Utilities
 * Helper functions for validating user inputs
 */

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Requires: at least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
export const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate phone number (basic format)
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate address format
 */
export const isValidAddress = (address) => {
  return address && address.trim().length >= 5 && address.trim().length <= 500;
};

/**
 * Validate price format
 */
export const isValidPrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0 && num <= 999999.99;
};

/**
 * Validate quantity
 */
export const isValidQuantity = (quantity) => {
  const num = parseInt(quantity);
  return !isNaN(num) && num > 0 && num <= 10000;
};

/**
 * Validate product ID
 */
export const isValidProductId = (id) => {
  const num = parseInt(id);
  return !isNaN(num) && num > 0;
};

/**
 * Validate order ID
 */
export const isValidOrderId = (id) => {
  const num = parseInt(id);
  return !isNaN(num) && num > 0;
};

/**
 * Validate user role
 */
export const isValidRole = (role) => {
  const validRoles = ['RETAIL', 'B2B', 'HAWKER', 'ADMIN'];
  return validRoles.includes(role);
};

/**
 * Validate order status
 */
export const isValidOrderStatus = (status) => {
  const validStatuses = ['PENDING', 'IN_COLD_STORAGE', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  return validStatuses.includes(status);
};

/**
 * Validate required fields
 */
export const validateRequired = (obj, fields) => {
  const missing = [];
  for (const field of fields) {
    if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
      missing.push(field);
    }
  }
  return missing;
};
