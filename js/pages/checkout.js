// Checkout Page Logic

document.addEventListener('DOMContentLoaded', () => {
  const checkoutContainer = document.getElementById('checkout');
  
  if (checkoutContainer) {
    const checkout = new Checkout(checkoutContainer);
    checkout.render();
  }
  
  // Handle checkout form submission
  const checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      try {
        const formData = new FormData(checkoutForm);
        const orderData = Object.fromEntries(formData);
        
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        
        if (response.ok) {
          const order = await response.json();
          window.location.href = `/order-detail.html?id=${order.id}`;
        } else {
          alert('Failed to create order. Please try again.');
        }
      } catch (error) {
        console.error('Checkout error:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }
});
