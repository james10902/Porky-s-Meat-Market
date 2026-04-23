// Utility Functions Module

class Utils {
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-NA', {
      style: 'currency',
      currency: 'NAD'
    }).format(amount);
  }
  
  static formatDate(date) {
    return new Date(date).toLocaleString('en-NA', {
      timeZone: 'Africa/Windhoek'
    });
  }
  
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  
  static showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 5000);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Utils;
}
