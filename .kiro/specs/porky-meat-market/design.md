# Porky's Meat Market Platform - Technical Design Document

## 1. Overview

Porky's Meat Market Platform is a multi-page vanilla JavaScript web application designed to serve retail customers, B2B buyers, hawker vendors, and administrators in Windhoek, Namibia. The platform is optimized for low-bandwidth (3G) and low-end smartphones with a progressive enhancement approach ensuring core functionality works without JavaScript.

**Key Characteristics:**
- Multi-page application (MPA) enhanced with dynamic JS rendering
- Vanilla JavaScript (ES6+), HTML5, CSS3 - no frameworks
- Mobile-first responsive design
- Dark mode theme with industrial premium aesthetic
- Performance-optimized for 2-3 second load times on 3G

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Vanilla JS)                    │
│  HTML5 Pages | CSS3 Styling | ES6+ JavaScript Modules       │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JSON)
                         │ JWT Authentication
                         │ CSRF Tokens
┌────────────────────────▼────────────────────────────────────┐
│              Backend (Node.js Express/NestJS)               │
│  Route Handlers | Middleware | Business Logic               │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL Queries
                         │ Parameterized Statements
┌────────────────────────▼────────────────────────────────────┐
│           Database (PostgreSQL)                              │
│  Users | Products | Orders | Notifications | Cart Items     │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

**Frontend:**
- HTML5 (semantic markup)
- CSS3 (Flexbox, Grid, CSS Variables)
- Vanilla JavaScript (ES6+)
- No external frameworks (React, Vue, Angular)
- Minimal dependencies (only essential utilities)

**Backend:**
- Node.js runtime
- Express.js or NestJS framework
- JWT for authentication
- CSRF middleware
- Input sanitization middleware

**Database:**
- PostgreSQL relational database
- Connection pooling
- Query optimization

**Deployment:**
- Frontend: Netlify, Vercel, or Apache server
- Backend: Cloud VM or container (Docker)
- CDN for static assets

## 3. Frontend Architecture

### 3.1 Directory Structure

```
porky-meat-market/
├── index.html                 # Home page
├── products.html              # Product catalog
├── product-detail.html        # Single product view
├── cart.html                  # Shopping cart
├── checkout.html              # Checkout flow
├── orders.html                # Order history
├── order-detail.html          # Order tracking
├── dashboard.html             # Admin dashboard
├── login.html                 # Authentication
├── register.html              # User registration
├── 404.html                   # Error page
├── assets/
│   ├── images/
│   │   ├── products/          # Product images
│   │   ├── timeline/          # Heritage timeline images
│   │   └── icons/             # UI icons
│   ├── fonts/                 # Custom fonts
│   └── data/
│       └── timeline.json      # Heritage timeline data
├── css/
│   ├── variables.css          # CSS custom properties (theme)
│   ├── base.css               # Reset, typography, base styles
│   ├── layout.css             # Grid, flexbox layouts
│   ├── components.css         # Component styles
│   ├── responsive.css         # Media queries
│   └── dark-mode.css          # Dark theme overrides
├── js/
│   ├── main.js                # Entry point, initialization
│   ├── modules/
│   │   ├── storage.js         # LocalStorage management
│   │   ├── api.js             # API communication
│   │   ├── auth.js            # Authentication logic
│   │   ├── cart.js            # Cart management
│   │   ├── validation.js      # Form validation
│   │   ├── sanitizer.js       # Input sanitization
│   │   └── utils.js           # Utility functions
│   ├── services/
│   │   ├── productService.js  # Product API calls
│   │   ├── orderService.js    # Order API calls
│   │   ├── authService.js     # Auth API calls
│   │   └── cacheService.js    # Caching logic
│   ├── components/
│   │   ├── ProductCard.js     # Product card component
│   │   ├── Cart.js            # Cart component
│   │   ├── Checkout.js        # Checkout component
│   │   ├── OrderTracker.js    # Order tracking component
│   │   ├── Timeline.js        # Heritage timeline component
│   │   ├── Navigation.js      # Navigation component
│   │   └── Modal.js           # Modal dialog component
│   └── pages/
│       ├── home.js            # Home page logic
│       ├── catalog.js         # Catalog page logic
│       ├── checkout.js        # Checkout page logic
│       ├── orders.js          # Orders page logic
│       └── admin.js           # Admin page logic
└── robots.txt                 # SEO robots file
└── sitemap.xml                # SEO sitemap
```

### 3.2 Design System

#### Color Palette (Dark Mode - Industrial Premium)

```css
:root {
  /* Primary Colors */
  --color-bg-primary: #121212;      /* Carbon Black */
  --color-bg-secondary: #1e1e1e;    /* Slightly lighter black */
  --color-bg-tertiary: #2a2a2a;     /* Even lighter for cards */
  
  /* Accent Colors */
  --color-accent-primary: #FFC107;  /* Amber */
  --color-accent-secondary: #8B0000; /* Crimson */
  
  /* Text Colors */
  --color-text-primary: #ffffff;    /* White */
  --color-text-secondary: #b0b0b0;  /* Light gray */
  --color-text-tertiary: #808080;   /* Medium gray */
  
  /* Status Colors */
  --color-success: #4caf50;         /* Green */
  --color-warning: #ff9800;         /* Orange */
  --color-error: #f44336;           /* Red */
  --color-info: #2196f3;            /* Blue */
  
  /* Borders & Shadows */
  --color-border: #333333;
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.5);
}
```

#### Typography

```css
:root {
  /* Font Families */
  --font-primary: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  --font-mono: 'Courier New', monospace;
  
  /* Font Sizes */
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */
  --font-size-3xl: 1.875rem;  /* 30px */
  --font-size-4xl: 2.25rem;   /* 36px */
  
  /* Font Weights */
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  
  /* Line Heights */
  --line-height-tight: 1.2;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;
}
```

#### Spacing Scale

```css
:root {
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */
  --spacing-3xl: 4rem;     /* 64px */
}
```

#### Responsive Breakpoints

```css
/* Mobile First Approach */
/* Mobile: < 768px (default) */
/* Tablet: 768px - 1024px */
/* Desktop: > 1024px */

@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}
```

### 3.3 Component Architecture

#### ProductCard Component

```javascript
// js/components/ProductCard.js
class ProductCard {
  constructor(product, container) {
    this.product = product;
    this.container = container;
  }
  
  render() {
    const html = `
      <div class="product-card" data-product-id="${this.product.id}">
        <div class="product-image">
          <img 
            src="${this.product.image_url}" 
            alt="${this.product.name}"
            loading="lazy"
            onerror="this.src='/assets/images/placeholder.png'"
          />
        </div>
        <div class="product-info">
          <h3 class="product-name">${this.sanitize(this.product.name)}</h3>
          <p class="product-description">${this.sanitize(this.product.description)}</p>
          <div class="product-footer">
            <span class="product-price">N$${this.product.price.toFixed(2)}</span>
            <button class="btn btn-primary" onclick="addToCart('${this.product.id}')">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
    this.container.innerHTML += html;
  }
  
  sanitize(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
```

#### Cart Component

```javascript
// js/components/Cart.js
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
```

#### OrderTracker Component

```javascript
// js/components/OrderTracker.js
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
```

#### Heritage Timeline Component

```javascript
// js/components/Timeline.js
class HeritageTimeline {
  constructor(container) {
    this.container = container;
    this.events = [];
  }
  
  async loadEvents() {
    try {
      const response = await fetch('/assets/data/timeline.json');
      this.events = await response.json();
      this.render();
      this.setupIntersectionObserver();
    } catch (error) {
      console.error('Failed to load timeline events:', error);
    }
  }
  
  render() {
    const html = `
      <div class="timeline-container">
        ${this.events.map((event, index) => `
          <div class="timeline-event" data-index="${index}">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h3>${event.year}</h3>
              <p>${event.description}</p>
              ${event.image ? `<img src="${event.image}" alt="${event.year}" loading="lazy" />` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    this.container.innerHTML = html;
  }
  
  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.timeline-event').forEach(el => observer.observe(el));
  }
}
```

## 4. Backend API Endpoints

### 4.1 Product Endpoints

```
GET /api/products
  Query params: category, minPrice, maxPrice, search, page, limit
  Response: { products: [], total: number, page: number }

GET /api/products/:id
  Response: { id, name, description, price, image_url, stock, category }

POST /api/products (Admin only)
  Body: { name, description, price, image_url, category, stock }
  Response: { id, ... }

PUT /api/products/:id (Admin only)
  Body: { name, description, price, image_url, category, stock }
  Response: { id, ... }

DELETE /api/products/:id (Admin only)
  Response: { success: true }
```

### 4.2 Cart Endpoints

```
POST /api/cart
  Body: { productId, quantity }
  Response: { cartId, items: [], total: number }

GET /api/cart
  Response: { items: [], total: number }

PUT /api/cart/:itemId
  Body: { quantity }
  Response: { items: [], total: number }

DELETE /api/cart/:itemId
  Response: { items: [], total: number }
```

### 4.3 Order Endpoints

```
POST /api/orders
  Body: { items: [], deliveryAddress, paymentMethod, csrfToken }
  Response: { orderId, orderNumber, status, estimatedDelivery }

GET /api/orders
  Query params: status, page, limit
  Response: { orders: [], total: number }

GET /api/orders/:id
  Response: { id, orderNumber, items: [], status, timeline: [], deliveryAddress }

PUT /api/orders/:id (Admin only)
  Body: { status }
  Response: { id, status, updatedAt }
```

### 4.4 Authentication Endpoints

```
POST /api/auth/register
  Body: { email, password, name, role }
  Response: { userId, email, token }

POST /api/auth/login
  Body: { email, password }
  Response: { userId, email, role, token }

POST /api/auth/logout
  Response: { success: true }

GET /api/auth/me
  Headers: { Authorization: "Bearer <token>" }
  Response: { userId, email, role, name }

POST /api/auth/refresh
  Response: { token }
```

### 4.5 Admin Endpoints

```
GET /api/admin/users
  Response: { users: [], total: number }

PUT /api/admin/users/:id
  Body: { role, status }
  Response: { id, ... }

DELETE /api/admin/users/:id
  Response: { success: true }

GET /api/admin/dashboard
  Response: { totalOrders, totalRevenue, recentOrders: [], topProducts: [] }
```

## 5. Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'RETAIL',
  status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(100),
  image_url VARCHAR(500),
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  total_amount DECIMAL(10, 2) NOT NULL,
  delivery_address TEXT NOT NULL,
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Order Items Table
```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notifications Table
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  order_id INTEGER REFERENCES orders(id),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. Performance Optimization

### 6.1 Frontend Optimization

**Image Optimization:**
- Use `loading="lazy"` attribute for deferred image loading
- Serve WebP format with PNG fallback
- Responsive images using `srcset` attribute
- Placeholder images for failed loads

**JavaScript Optimization:**
- Minify and bundle JavaScript
- Use `defer` attribute on script tags
- Lazy load non-critical JavaScript
- Avoid blocking operations

**CSS Optimization:**
- Minify CSS
- Use CSS variables for theming
- Critical CSS inline in `<head>`
- Non-critical CSS deferred

**Caching Strategy:**
```javascript
// js/services/cacheService.js
class CacheService {
  static set(key, value, ttl = 3600000) { // 1 hour default
    const item = {
      value,
      expiry: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  }
  
  static get(key) {
    const item = JSON.parse(localStorage.getItem(key));
    if (!item) return null;
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  }
}
```

### 6.2 Backend Optimization

- Implement response compression (gzip)
- Database query optimization with indexes
- Connection pooling
- Rate limiting on API endpoints
- Response caching headers

## 7. Security Implementation

### 7.1 Authentication

```javascript
// JWT token stored in HTTP-only cookie
// Backend sets: Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict
```

### 7.2 CSRF Protection

```javascript
// Frontend includes CSRF token in POST/PUT/DELETE requests
const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

### 7.3 Input Sanitization

```javascript
// js/modules/sanitizer.js
class Sanitizer {
  static sanitizeHTML(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }
  
  static sanitizeEmail(email) {
    return email.toLowerCase().trim();
  }
  
  static sanitizeNumber(num) {
    return parseFloat(num) || 0;
  }
}
```

### 7.4 Parameterized Queries

```javascript
// Backend uses parameterized queries
// Example with Node.js pg library:
const result = await client.query(
  'SELECT * FROM products WHERE id = $1',
  [productId]
);
```

## 8. Progressive Enhancement

### 8.1 No-JavaScript Fallback

**HTML Forms for Cart:**
```html
<form method="POST" action="/cart/add">
  <input type="hidden" name="productId" value="123">
  <input type="number" name="quantity" value="1" min="1">
  <button type="submit">Add to Cart</button>
</form>
```

**Server-Rendered Pages:**
- Backend renders HTML for all pages
- JavaScript enhances with dynamic features
- Forms work with or without JavaScript

### 8.2 Semantic HTML

```html
<header>
  <nav>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/products">Products</a></li>
    </ul>
  </nav>
</header>

<main>
  <section class="products">
    <article class="product-card">
      <!-- Product content -->
    </article>
  </section>
</main>

<footer>
  <!-- Footer content -->
</footer>
```

## 9. Accessibility

### 9.1 ARIA Labels

```html
<button aria-label="Add to cart" class="btn-add-cart">
  <span aria-hidden="true">+</span>
</button>

<div role="alert" class="notification">
  Item added to cart
</div>
```

### 9.2 Keyboard Navigation

```css
/* Visible focus indicators */
button:focus,
a:focus,
input:focus {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}
```

### 9.3 Color Contrast

All text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)

## 10. Error Handling

### 10.1 API Error Handling

```javascript
// js/modules/api.js
async function fetchAPI(url, options = {}) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 401) {
        // Redirect to login
        window.location.href = '/login';
      } else if (response.status === 403) {
        // Show access denied
        showError('Access denied');
      } else if (response.status >= 500) {
        // Show generic error
        showError('Server error. Please try again later.');
      }
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    showError('Failed to load data. Please check your connection.');
    throw error;
  }
}
```

### 10.2 User-Friendly Error Messages

```javascript
function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.insertBefore(errorDiv, document.body.firstChild);
  
  setTimeout(() => errorDiv.remove(), 5000);
}
```

## 11. Testing Strategy

### 11.1 Unit Tests
- Test utility functions
- Test validation logic
- Test sanitization functions

### 11.2 Integration Tests
- Test API endpoints
- Test database operations
- Test authentication flow

### 11.3 E2E Tests
- Test user workflows (browse → cart → checkout)
- Test order tracking
- Test admin functions

### 11.4 Performance Tests
- Load time on 3G networks
- Scrolling performance on low-end devices
- Memory usage

## 12. Deployment

### 12.1 Frontend Deployment

```bash
# Build process
npm run build

# Output: dist/ folder with minified assets
# Deploy to: Netlify, Vercel, or Apache server
```

### 12.2 Backend Deployment

```bash
# Docker container
docker build -t porky-api .
docker run -p 3000:3000 porky-api

# Environment variables:
# DATABASE_URL=postgresql://...
# JWT_SECRET=...
# NODE_ENV=production
```

### 12.3 Database Deployment

```bash
# PostgreSQL setup
createdb porky_market
psql porky_market < schema.sql
```

## 13. Monitoring & Analytics

### 13.1 Frontend Analytics

```javascript
// Track page views
function trackPageView(page) {
  fetch('/api/analytics/pageview', {
    method: 'POST',
    body: JSON.stringify({ page, timestamp: Date.now() })
  });
}

// Track user interactions
document.addEventListener('click', (e) => {
  if (e.target.matches('button, a')) {
    fetch('/api/analytics/click', {
      method: 'POST',
      body: JSON.stringify({ element: e.target.className })
    });
  }
});
```

### 13.2 Backend Monitoring

- Log all API requests with response times
- Monitor error rates
- Track database query performance
- Alert on anomalies

## 14. SEO Optimization

### 14.1 Meta Tags

```html
<meta name="description" content="Leading meat wholesaler in Windhoek, Namibia">
<meta name="keywords" content="meat, wholesale, retail, Windhoek">
<meta property="og:title" content="Porky's Meat Market">
<meta property="og:description" content="Premium meat products">
<meta property="og:image" content="/assets/images/og-image.png">
```

### 14.2 Structured Data

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Porky's Meat Market",
  "url": "https://porkymeatmarket.com",
  "logo": "/assets/images/logo.png"
}
</script>
```

### 14.3 Sitemap & Robots

```xml
<!-- sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://porkymeatmarket.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://porkymeatmarket.com/products</loc>
    <priority>0.8</priority>
  </url>
</urlset>
```

```
# robots.txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: https://porkymeatmarket.com/sitemap.xml
```

## 15. Localization

### 15.1 Currency & Timezone

```javascript
// All prices in NAD (Namibian Dollar)
const formatter = new Intl.NumberFormat('en-NA', {
  style: 'currency',
  currency: 'NAD'
});

// All dates in Africa/Windhoek timezone
const date = new Date().toLocaleString('en-NA', {
  timeZone: 'Africa/Windhoek'
});
```

### 15.2 i18n Patterns

```javascript
// Future-proof i18n structure
const i18n = {
  en: {
    'cart.add': 'Add to Cart',
    'cart.remove': 'Remove from Cart',
    'checkout.confirm': 'Confirm Order'
  }
};

function t(key) {
  return i18n['en'][key] || key;
}
```
