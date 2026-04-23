// Product API Service

class ProductService {
  static async getProducts(filters = {}) {
    const params = new URLSearchParams(filters);
    return await fetch(`/api/products?${params}`).then(res => res.json());
  }
  
  static async getProduct(id) {
    return await fetch(`/api/products/${id}`).then(res => res.json());
  }
  
  static async createProduct(product) {
    return await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }).then(res => res.json());
  }
  
  static async updateProduct(id, product) {
    return await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }).then(res => res.json());
  }
  
  static async deleteProduct(id) {
    return await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    }).then(res => res.json());
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProductService;
}
