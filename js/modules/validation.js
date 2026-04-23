// Form Validation Module

class ValidationService {
  static validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }
  
  static validatePassword(password) {
    // Minimum 8 characters, at least one letter and one number
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
  }
  
  static validateRequired(value) {
    return value !== null && value !== undefined && value.trim() !== '';
  }
  
  static validateNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }
  
  static validatePhone(phone) {
    const regex = /^\+?[\d\s-()]+$/;
    return regex.test(phone);
  }
  
  static showError(element, message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    element.parentNode.insertBefore(errorDiv, element.nextSibling);
  }
  
  static clearErrors(form) {
    const errors = form.querySelectorAll('.error-message');
    errors.forEach(error => error.remove());
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationService;
}
