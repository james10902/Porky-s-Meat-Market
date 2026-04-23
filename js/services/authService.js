// Authentication API Service

class AuthAPIService {
  static async login(email, password) {
    return await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }).then(res => res.json());
  }
  
  static async register(name, email, password) {
    return await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    }).then(res => res.json());
  }
  
  static async logout() {
    return await fetch('/api/auth/logout', {
      method: 'POST'
    }).then(res => res.json());
  }
  
  static async getCurrentUser() {
    return await fetch('/api/auth/me').then(res => res.json());
  }
  
  static async refreshToken() {
    return await fetch('/api/auth/refresh', {
      method: 'POST'
    }).then(res => res.json());
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthAPIService;
}
