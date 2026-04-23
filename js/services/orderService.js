// Order API Service

class OrderService {
  static async createOrder(orderData) {
    return await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).then(res => res.json());
  }
  
  static async getOrders(filters = {}) {
    const params = new URLSearchParams(filters);
    return await fetch(`/api/orders?${params}`).then(res => res.json());
  }
  
  static async getOrder(id) {
    return await fetch(`/api/orders/${id}`).then(res => res.json());
  }
  
  static async updateOrderStatus(id, status) {
    return await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).then(res => res.json());
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderService;
}
