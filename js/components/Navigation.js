// Navigation Component

class Navigation {
  constructor(container) {
    this.container = container;
  }
  
  render(userRole = 'RETAIL') {
    const links = this.getLinksForRole(userRole);
    
    const html = `
      <nav class="main-nav">
        <ul>
          ${links.map(link => `
            <li><a href="${link.url}">${link.label}</a></li>
          `).join('')}
        </ul>
      </nav>
    `;
    
    this.container.innerHTML = html;
  }
  
  getLinksForRole(role) {
    const commonLinks = [
      { url: '/index.html', label: 'Home' },
      { url: '/products.html', label: 'Products' },
      { url: '/cart.html', label: 'Cart' },
      { url: '/orders.html', label: 'Orders' }
    ];
    
    if (role === 'ADMIN') {
      return [...commonLinks, { url: '/dashboard.html', label: 'Admin' }];
    } else if (role === 'B2B') {
      return [...commonLinks, { url: '/b2b-portal.html', label: 'B2B Portal' }];
    } else if (role === 'HAWKER') {
      return [...commonLinks, { url: '/hawker-fast-order.html', label: 'Fast Order' }];
    }
    
    return commonLinks;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Navigation;
}
