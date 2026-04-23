# Backend Setup Guide

## Task 1.2: Set up Node.js backend with Express.js - COMPLETED

This guide walks through the backend setup that has been completed.

## What Was Created

### 1. Project Structure
```
backend/
├── src/
│   ├── index.js                 # Main Express application
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication & authorization
│   │   ├── csrfProtection.js    # CSRF token generation & validation
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── requestLogger.js     # HTTP request logging
│   │   └── sanitizeInputs.js    # Input sanitization (XSS prevention)
│   ├── routes/
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── products.js          # Product catalog endpoints
│   │   ├── cart.js              # Shopping cart endpoints
│   │   ├── orders.js            # Order management endpoints
│   │   └── admin.js             # Admin dashboard endpoints
│   └── utils/
│       ├── jwt.js               # JWT token utilities
│       ├── password.js          # Password hashing (bcrypt)
│       └── validation.js        # Input validation helpers
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore configuration
├── package.json                 # Dependencies & scripts
├── README.md                    # API documentation
└── SETUP_GUIDE.md              # This file
```

### 2. Core Features Implemented

#### Express.js Server (`src/index.js`)
- ✅ Express application initialization
- ✅ Security middleware (Helmet, CORS, compression)
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Request logging
- ✅ Input sanitization
- ✅ CSRF protection
- ✅ Health check endpoint (`GET /health`)
- ✅ Global error handling
- ✅ Graceful shutdown handling

#### Middleware Stack
- **Security**: Helmet (security headers), CORS, compression
- **Authentication**: JWT token verification, role-based authorization
- **CSRF Protection**: Token generation and validation
- **Input Sanitization**: XSS prevention via input cleaning
- **Error Handling**: Global error handler with consistent responses
- **Logging**: Request/response logging with timing

#### Database Configuration (`src/config/database.js`)
- ✅ PostgreSQL connection pool (max 20 connections)
- ✅ Connection timeout handling
- ✅ Query execution logging
- ✅ Error handling
- ✅ Pool cleanup on shutdown

#### API Routes (Placeholder Structure)
- **Authentication** (`/api/auth`): register, login, logout, me, refresh
- **Products** (`/api/products`): list, get, create, update, delete
- **Cart** (`/api/cart`): get, add, update, remove items
- **Orders** (`/api/orders`): list, get, create, update
- **Admin** (`/api/admin`): dashboard, user management

#### Utilities
- **JWT**: Token generation, verification, payload creation
- **Password**: Bcrypt hashing and verification
- **Validation**: Email, password, phone, address, price, quantity validation

### 3. Dependencies Installed

```json
{
  "express": "^4.18.2",           // Web framework
  "pg": "^8.11.3",                // PostgreSQL client
  "jsonwebtoken": "^9.1.2",       // JWT authentication
  "bcryptjs": "^2.4.3",           // Password hashing
  "dotenv": "^16.3.1",            // Environment variables
  "cors": "^2.8.5",               // CORS middleware
  "helmet": "^7.1.0",             // Security headers
  "express-rate-limit": "^7.1.5", // Rate limiting
  "compression": "^1.7.4"         // Response compression
}
```

### 4. Environment Configuration

Created `.env.example` with all required variables:
- Server: PORT, HOST, NODE_ENV
- Database: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
- JWT: JWT_SECRET, JWT_EXPIRY
- CORS: CORS_ORIGIN
- Rate Limiting: RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS
- API: API_PREFIX

## Next Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Set Up Database
```bash
# Create PostgreSQL database
createdb porky_market

# Database schema will be created in task 1.4
```

### 4. Start Development Server
```bash
npm run dev
```

Server will start on `http://localhost:3000`

### 5. Verify Server
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "development"
}
```

## Architecture Overview

### Request Flow
```
Client Request
    ↓
CORS Middleware
    ↓
Helmet (Security Headers)
    ↓
Compression
    ↓
Rate Limiter
    ↓
Request Logger
    ↓
Input Sanitizer
    ↓
CSRF Protection
    ↓
Route Handler
    ↓
Authentication (if required)
    ↓
Authorization (if required)
    ↓
Business Logic
    ↓
Database Query
    ↓
Response
    ↓
Error Handler (if error)
```

### Security Features
1. **JWT Authentication**: Stateless token-based auth
2. **CSRF Protection**: Token validation on state-changing requests
3. **Input Sanitization**: XSS prevention
4. **Password Hashing**: Bcrypt with salt rounds
5. **Rate Limiting**: Prevent API abuse
6. **Security Headers**: Via Helmet middleware
7. **CORS**: Configurable cross-origin requests
8. **Parameterized Queries**: SQL injection prevention (in database layer)

## API Endpoints Structure

All endpoints follow REST conventions:

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart

### Orders
- `GET /api/orders` - List user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order (admin)

### Admin
- `GET /api/admin/dashboard` - Dashboard metrics
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Error Handling

All errors return consistent JSON responses:

```json
{
  "error": {
    "status": 400,
    "message": "Error description"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Development Commands

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run linter
npm run lint
```

## Database Connection

The backend uses PostgreSQL with connection pooling:
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

Connection string format:
```
postgresql://user:password@host:port/database
```

## Deployment Considerations

### Environment Variables
- Set `NODE_ENV=production` for production
- Use strong `JWT_SECRET` (minimum 32 characters)
- Configure `CORS_ORIGIN` for your frontend domain
- Use environment-specific database URLs

### Security
- Enable HTTPS in production
- Use secure cookies (HttpOnly, Secure, SameSite)
- Implement rate limiting per IP
- Monitor error logs
- Regular security audits

### Performance
- Use connection pooling (already configured)
- Enable response compression (already configured)
- Implement caching headers
- Monitor database query performance
- Use CDN for static assets

## Troubleshooting

### Port Already in Use
```bash
# Change PORT in .env or use:
PORT=3001 npm run dev
```

### Database Connection Failed
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Verify database exists: `psql -l`
- Check user permissions

### CORS Errors
- Verify CORS_ORIGIN matches frontend URL
- Check request headers
- Verify credentials: true if needed

## Next Phase Tasks

After this setup is complete, the following tasks will implement:
- Task 1.3: PostgreSQL database connection
- Task 1.4: Database schema creation
- Task 1.5: Environment variables configuration
- Task 3.1-3.12: Authentication endpoints
- Task 4.1-4.14: Product catalog endpoints
- And more...

## References

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Node.js Client](https://node-postgres.com/)
- [JWT Authentication](https://jwt.io/)
- [Bcrypt Password Hashing](https://github.com/dcodeIO/bcrypt.js)
- [OWASP Security Guidelines](https://owasp.org/)
