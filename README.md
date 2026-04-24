# Porky's Meat Market — E-Commerce Platform

A full-stack e-commerce platform for Porky's Meat Market, Windhoek, Namibia.  
Built with vanilla HTML/CSS/JS on the frontend and Node.js + PostgreSQL on the backend.

---

## Project Structure

```
/                          ← Frontend (static files)
├── index.html             ← Home page
├── 404.html               ← Not-found page
├── pages/
│   ├── login.html         ← Sign in / Register
│   ├── products.html      ← Product catalogue
│   ├── heritage.html      ← Company history
│   ├── wholesale.html     ← B2B wholesale quotes
│   ├── contact.html       ← Contact form + map
│   ├── dashboard.html     ← Orders, tracking, account
│   └── checkout.html      ← Multi-step checkout + payment
├── css/
│   ├── design-system.css  ← CSS variables, typography, light/dark theme
│   ├── components.css     ← Shared components (nav, cart, buttons, etc.)
│   ├── footer.css         ← Premium footer
│   └── pages/             ← Page-specific styles
├── js/
│   ├── utils/dom.js       ← DOM utility helpers
│   ├── services/api.js    ← HTTP service layer (real API + localStorage fallback)
│   └── modules/
│       ├── auth.js        ← Authentication (API + localStorage fallback)
│       ├── authGate.js    ← Inline login modal for guests
│       ├── authPage.js    ← Login/register page logic
│       ├── cart.js        ← Shopping cart (localStorage)
│       ├── cartDrawer.js  ← Slide-out cart UI
│       ├── checkout.js    ← Multi-step checkout flow
│       ├── contact.js     ← Contact form
│       ├── dashboard.js   ← Order history & tracking
│       ├── heritage.js    ← Timeline animations
│       ├── home.js        ← Home page dynamic content
│       ├── nav.js         ← Sticky nav + mobile menu
│       ├── products.js    ← Product catalogue + filters
│       ├── theme.js       ← Day/night toggle
│       └── wholesale.js   ← Wholesale quote form
└── assets/Images/         ← Product & gallery images

/backend/                  ← Node.js + Express API
├── src/
│   ├── server.js          ← Express app entry point
│   ├── db/
│   │   ├── pool.js        ← PostgreSQL connection pool
│   │   ├── migrate.js     ← Schema migrations
│   │   └── seed.js        ← Seed categories & products
│   ├── middleware/
│   │   ├── auth.js        ← JWT middleware
│   │   └── validate.js    ← express-validator helper
│   └── routes/
│       ├── auth.js        ← /api/auth
│       ├── products.js    ← /api/products
│       ├── orders.js      ← /api/orders
│       └── contact.js     ← /api/contact + /api/wholesale
├── package.json
├── .env.example
└── README.md
```

---

## Getting Started

### Frontend only (no backend)
Open `index.html` with a local server (e.g. VS Code Live Server).  
Auth and cart use localStorage — fully functional without a backend.

### Full stack
```bash
# 1. Set up the backend
cd backend
npm install
cp .env.example .env        # fill in DB credentials and JWT secret
createdb porkys_db
npm run migrate             # create tables
npm run seed                # insert categories + products
npm run dev                 # start API on :3000

# 2. Open the frontend
# Either use Live Server (port 5500) or let Express serve it:
# NODE_ENV=production npm start
```

See `backend/README.md` for full API documentation.

---

## Key Features

| Feature | Status |
|---------|--------|
| Product catalogue with filters & search | ✅ |
| Shopping cart (localStorage) | ✅ |
| User registration & login | ✅ API + localStorage fallback |
| Auth gate modal (guest → login) | ✅ |
| Multi-step checkout | ✅ |
| Payment methods (Card, EFT, Mobile, COD) | ✅ UI |
| Order history & tracking dashboard | ✅ |
| Day / Night theme toggle | ✅ |
| Responsive design (mobile-first) | ✅ |
| Premium footer with newsletter | ✅ |
| Contact form | ✅ API + fallback |
| Wholesale quote form | ✅ API + fallback |
| Heritage timeline | ✅ |
| Google Maps embed | ✅ |
| 404 page | ✅ |
| PostgreSQL backend | ✅ |
| JWT authentication | ✅ |
| Rate limiting & security headers | ✅ |

---

## Tech Stack

**Frontend:** HTML5 · CSS3 (custom design system) · Vanilla JS (ES6+)  
**Backend:** Node.js · Express · PostgreSQL · JWT · bcryptjs  
**Design:** CSS Variables · Flexbox · CSS Grid · Inter + Bebas Neue fonts
