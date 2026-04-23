// Cart Management Module

class CartService {
  static getCart() {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
  }
  
  static saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
  }
  
  static addItem(productId, quantity = 1) {
    const cart = this.getCart();
    const existing = cart.find(item => item.productId === productId);
    
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }
    
    this.saveCart(cart);
    this.updateBadge();
  }
  
  static removeItem(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.productId !== productId);
    this.saveCart(cart);
    this.updateBadge();
  }
  
  static updateQuantity(productId, quantity) {
    const cart = this.getCart();
    const item = cart.find(item => item.productId === productId);
    
    if (item) {
      item.quantity = Math.max(1, quantity);
      this.saveCart(cart);
      this.updateBadge();
    }
  }
  
  static clearCart() {
    localStorage.removeItem('cart');
    this.updateBadge();
  }
  
  static updateBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      const cart = this.getCart();
      badge.textContent = cart.length;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartService;
}
