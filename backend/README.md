# Porky's Meat Market — Backend API

Node.js + Express REST API backed by PostgreSQL.

---

## Quick Start

```bash
cd backend
npm install

# 1. Copy and configure environment variables
cp .env.example .env
# Edit .env — set DB_PASSWORD and JWT_SECRET at minimum

# 2. Create the PostgreSQL database
createdb porkys_db

# 3. Run migrations (creates all tables + triggers)
npm run migrate

# 4. Seed categories and all 14 products
npm run seed

# 5. Start the development server (auto-restarts on changes)
npm run dev
```

The API runs at **http://localhost:3000**.  
Health check: **http://localhost:3000/api/health**

---

## Running Tests

Tests require a running PostgreSQL database (uses the same DB as dev).

```bash
npm test
```

Test files live in `src/tests/`. Each suite registers and cleans up its own test data.

---

## API Reference

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account → returns `{ token, user }` |
| POST | `/login` | — | Sign in → returns `{ token, user }` |
| GET | `/me` | ✅ | Current user profile |
| PUT | `/profile` | ✅ | Update firstname / lastname / phone |
| POST | `/change-password` | ✅ | Change password |

### Products — `/api/products`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | — | List products. Query: `category`, `search`, `sort` (name/price-low/price-high/newest), `page`, `limit` |
| GET | `/featured` | — | Featured products (up to 8) |
| GET | `/categories` | — | All categories with product counts |
| GET | `/:id` | — | Single product |
| POST | `/` | Admin | Create product |
| PUT | `/:id` | Admin | Update product fields |
| DELETE | `/:id` | Admin | Soft-delete (sets `is_active = FALSE`) |

### Orders — `/api/orders`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | ✅ | Place order. Validates stock, calculates totals server-side |
| GET | `/` | ✅ | My orders (with items) |
| GET | `/admin/all` | Admin | All orders with pagination |
| GET | `/:id` | ✅ | Order detail + delivery address + items |
| GET | `/:id/tracking` | ✅ | Tracking steps for an order |
| PATCH | `/:id/cancel` | ✅ | Cancel (PENDING or CONFIRMED only) |
| PATCH | `/:id/status` | Admin | Update order status |

**Order statuses:** `PENDING → CONFIRMED → IN_COLD_STORAGE → OUT_FOR_DELIVERY → DELIVERED`  
**Payment methods:** `card`, `eft`, `mobile`, `cod`

### Contact — `/api/contact`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | — | Submit contact message |
| POST | `/wholesale` | — | Submit wholesale quote request |

### Admin — `/api/admin`

All routes require `role = 'admin'`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Stats: orders, revenue, users, products, recent orders |
| GET | `/users` | List users (search, paginate) |
| GET | `/users/:id` | User detail + order history |
| PATCH | `/users/:id/role` | Change user role |
| PATCH | `/users/:id/active` | Enable / disable user |
| GET | `/contact` | Contact messages (filter unread) |
| PATCH | `/contact/:id/read` | Mark message as read |
| GET | `/wholesale` | Wholesale quote requests |
| PATCH | `/wholesale/:id/status` | Update quote status |

### Health

```
GET /api/health   →  { status, db, timestamp }
```

---

## Database Schema

```
users                — customer accounts (UUID PK)
categories           — product categories
products             — catalogue with pricing, stock, featured flag
orders               — placed orders (UUID PK, order_number)
order_items          — line items per order (price snapshot)
delivery_addresses   — delivery details per order
wholesale_quotes     — B2B quote requests
contact_messages     — contact form submissions
```

All tables have `created_at`. `users`, `products`, `orders` also have `updated_at` maintained by a trigger.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | `development` or `production` |
| `DB_HOST` | Yes | PostgreSQL host |
| `DB_PORT` | No | PostgreSQL port (default: 5432) |
| `DB_NAME` | Yes | Database name |
| `DB_USER` | Yes | Database user |
| `DB_PASSWORD` | Yes | Database password |
| `JWT_SECRET` | Yes | Secret for signing JWTs — **must be changed in production** |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: 7d) |
| `ALLOWED_ORIGINS` | No | CORS whitelist, comma-separated |

---

## Security

- **Helmet** — sets secure HTTP headers
- **CORS** — origin whitelist via `ALLOWED_ORIGINS`
- **Rate limiting** — 200 req/15min general; 20 req/15min on auth endpoints
- **bcryptjs** — passwords hashed with cost factor 12
- **JWT** — stateless auth, 7-day expiry
- **express-validator** — all inputs validated and sanitised
- **Parameterised queries** — no raw string interpolation in SQL
- **Server-side price calculation** — order totals always computed from DB prices, never trusted from client

---

## Frontend Integration

`js/services/api.js` auto-detects the API URL:
- **Dev** (Live Server on :5500) → `http://localhost:3000/api`
- **Production** (Express serves frontend on :3000) → `/api`

Auth, checkout, dashboard, and contact forms all try the real API first and fall back to localStorage if the server is unreachable — so the frontend works standalone during development.
