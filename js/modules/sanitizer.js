// Input Sanitization Module

class SanitizerService {
  static sanitizeHTML(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
  
  static sanitizeEmail(email) {
    return email.toLowerCase().trim();
  }
  
  static sanitizeNumber(num) {
    return parseFloat(num) || 0;
  }
  
  static sanitizeString(str) {
    return str.trim().replace(/[<>]/g, '');
  }
  
  static sanitizeURL(url) {
    try {
      const parsed = new URL(url);
      return parsed.href;
    } catch {
      return '';
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SanitizerService;
}
