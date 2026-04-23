// Order Tracker Component

class OrderTracker {
  constructor(order) {
    this.order = order;
    this.statuses = ['PENDING', 'IN_COLD_STORAGE', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  }
  
  render(container) {
    const currentIndex = this.statuses.indexOf(this.order.status);
    
    const html = `
      <div class="order-tracker">
        <div class="timeline">
          ${this.statuses.map((status, index) => `
            <div class="step ${index <= currentIndex ? 'active' : ''}">
              <div class="step-circle">${index + 1}</div>
              <div class="step-label">${status}</div>
            </div>
          `).join('')}
        </div>
        <div class="order-details">
          <p>Current Status: <strong>${this.order.status}</strong></p>
          <p>Updated: ${new Date(this.order.updated_at).toLocaleString()}</p>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrderTracker;
}
