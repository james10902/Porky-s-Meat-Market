// Admin Page Logic

document.addEventListener('DOMContentLoaded', async () => {
  const dashboardContent = document.getElementById('dashboard-content');
  
  if (dashboardContent) {
    try {
      // Fetch admin dashboard data
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      
      // Render dashboard content
      const html = `
        <div class="dashboard-stats">
          <div class="stat-card">
            <h3>Total Orders</h3>
            <p>${data.totalOrders}</p>
          </div>
          <div class="stat-card">
            <h3>Total Revenue</h3>
            <p>N$${data.totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        <div class="recent-orders">
          <h3>Recent Orders</h3>
          <ul>
            ${data.recentOrders.map(order => `
              <li>Order #${order.order_number} - ${order.status}</li>
            `).join('')}
          </ul>
        </div>
      `;
      
      dashboardContent.innerHTML = html;
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      dashboardContent.innerHTML = '<p>Failed to load dashboard. Please try again later.</p>';
    }
  }
});
