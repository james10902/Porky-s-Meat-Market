// LocalStorage Management Module

class StorageService {
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }
  
  static get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Storage error:', error);
      return null;
    }
  }
  
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }
  
  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage error:', error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageService;
}
