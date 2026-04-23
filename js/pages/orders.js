// Orders Page Logic

document.addEventListener('DOMContentLoaded', async () => {
  const orderList = document.getElementById('order-list');
  
  if (orderList) {
    try {
      // Fetch orders from API
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (data.orders.length === 0) {
        orderList.innerHTML = '<p>No orders found.</p>';
      } else {
        // Render order list
        data.orders.forEach(order => {
          const orderCard = `
            <div class="order-card">
              <h3>Order #${order.order_number}</h3>
              <p>Status: ${order.status}</p>
              <p>Total: N$${order.total_amount.toFixed(2)}</p>
              <p>Date: ${new Date(order.created_at).toLocaleDateString()}</p>
              <a href="/order-detail.html?id=${order.id}" class="btn btn-primary">View Details</a>
            </div>
          `;
          orderList.innerHTML += orderCard;
        });
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      orderList.innerHTML = '<p>Failed to load orders. Please try again later.</p>';
    }
  }
});
