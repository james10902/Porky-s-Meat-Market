// API Communication Module

class APIService {
  static async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login.html';
        } else if (response.status === 403) {
          throw new Error('Access denied');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  static async get(url) {
    return this.request(url, { method: 'GET' });
  }
  
  static async post(url, data) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  static async put(url, data) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  static async delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIService;
}
