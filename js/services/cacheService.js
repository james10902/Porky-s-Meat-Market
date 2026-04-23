// Caching Service

class CacheService {
  static set(key, value, ttl = 3600000) { // 1 hour default
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(`cache_${key}`, JSON.stringify(item));
  }
  
  static get(key) {
    const item = localStorage.getItem(`cache_${key}`);
    if (!item) return null;
    
    const parsed = JSON.parse(item);
    if (Date.now() > parsed.expiry) {
      localStorage.removeItem(`cache_${key}`);
      return null;
    }
    
    return parsed.value;
  }
  
  static remove(key) {
    localStorage.removeItem(`cache_${key}`);
  }
  
  static clear() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CacheService;
}
