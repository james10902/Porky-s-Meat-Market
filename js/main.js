// Main Entry Point - Application Initialization

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('Porky\'s Meat Market Platform initialized');
  
  // Initialize cart badge
  updateCartBadge();
});

// Update cart badge count
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    badge.textContent = cart.length;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { updateCartBadge };
}
