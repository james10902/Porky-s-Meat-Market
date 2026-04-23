// Authentication Logic Module

class AuthService {
  static isAuthenticated() {
    // Check if user has valid token (stored in HTTP-only cookie)
    // This is a placeholder - actual implementation depends on backend
    return document.cookie.includes('token=');
  }
  
  static async login(email, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  static async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/index.html';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  static async register(name, email, password) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      if (!response.ok) {
        throw new Error('Registration failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthService;
}
