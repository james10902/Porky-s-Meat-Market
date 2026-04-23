// Cart Component

class Cart {
  constructor() {
    this.items = this.loadFromStorage();
  }
  
  loadFromStorage() {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  }
  
  saveToStorage() {
    localStorage.setItem('cart', JSON.stringify(this.items));
  }
  
  addItem(productId, quantity = 1) {
    const existing = this.items.find(item => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ productId, quantity });
    }
    this.saveToStorage();
    this.updateUI();
  }
  
  removeItem(productId) {
    this.items = this.items.filter(item => item.productId !== productId);
    this.saveToStorage();
    this.updateUI();
  }
  
  updateQuantity(productId, quantity) {
    const item = this.items.find(item => item.productId === productId);
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.saveToStorage();
      this.updateUI();
    }
  }
  
  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }
  
  updateUI() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.textContent = this.items.length;
    }
  }
  
  clear() {
    this.items = [];
    this.saveToStorage();
    this.updateUI();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Cart;
}
