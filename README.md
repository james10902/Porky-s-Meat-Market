# Porky's Meat Market Platform

A multi-page vanilla JavaScript web application for a meat market platform serving retail customers, B2B buyers, hawker vendors, and administrators in Windhoek, Namibia.

## Project Structure

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
├── robots.txt                 # SEO robots file
├── sitemap.xml                # SEO sitemap
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
└── js/
    ├── main.js                # Entry point, initialization
    ├── modules/
    │   ├── storage.js         # LocalStorage management
    │   ├── api.js             # API communication
    │   ├── auth.js            # Authentication logic
    │   ├── cart.js            # Cart management
    │   ├── validation.js      # Form validation
    │   ├── sanitizer.js       # Input sanitization
    │   └── utils.js           # Utility functions
    ├── services/
    │   ├── productService.js  # Product API calls
    │   ├── orderService.js    # Order API calls
    │   ├── authService.js     # Auth API calls
    │   └── cacheService.js    # Caching logic
    ├── components/
    │   ├── ProductCard.js     # Product card component
    │   ├── Cart.js            # Cart component
    │   ├── Checkout.js        # Checkout component
    │   ├── OrderTracker.js    # Order tracking component
    │   ├── Timeline.js        # Heritage timeline component
    │   ├── Navigation.js      # Navigation component
    │   └── Modal.js           # Modal dialog component
    └── pages/
        ├── home.js            # Home page logic
        ├── catalog.js         # Catalog page logic
        ├── checkout.js        # Checkout page logic
        ├── orders.js          # Orders page logic
        └── admin.js           # Admin page logic
```

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Backend**: Node.js with Express/NestJS (to be implemented)
- **Database**: PostgreSQL (to be implemented)
- **Design**: Dark mode theme with Carbon Black, Amber, and Crimson colors

## Features

- Multi-page application with progressive enhancement
- Mobile-first responsive design
- Dark mode theme (industrial premium aesthetic)
- Role-based access control (Retail, B2B, Hawker, Admin)
- Shopping cart with localStorage persistence
- Order tracking with status visualization
- Heritage timeline with scroll animations
- Performance optimized for 3G networks and low-end devices

## Getting Started

1. Clone the repository
2. Open `index.html` in a web browser to view the frontend
3. Set up the backend server (see backend documentation)
4. Configure the database (see database schema in design document)

## Development

This project uses vanilla JavaScript without frameworks. All JavaScript modules are organized by functionality:

- **modules/**: Core utilities and services
- **services/**: API communication layer
- **components/**: Reusable UI components
- **pages/**: Page-specific logic

## Next Steps

- Set up Node.js backend with Express.js
- Configure PostgreSQL database
- Implement authentication endpoints
- Implement product and order APIs
- Add product images and assets
- Configure deployment pipeline

## License

Copyright © 2024 Porky's Meat Market. All rights reserved.
