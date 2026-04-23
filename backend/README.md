# Porky's Meat Market - Backend API

Node.js Express.js backend API for Porky's Meat Market Platform.

## Project Structure

```
backend/
├── src/
│   ├── index.js                 # Main application entry point
│   ├── config/
│   │   └── database.js          # Database connection configuration
│   ├── middleware/
│   │   ├── auth.js              # Authentication & authorization
│   │   ├── csrfProtection.js    # CSRF token protection
│   │   ├── errorHandler.js      # Global error handling
│   │   ├── requestLogger.js     # Request logging
│   │   └── sanitizeInputs.js    # Input sanitization
│   ├── routes/
│   │   ├── auth.js              # Authentication endpoints
│   │   ├── products.js          # Product endpoints
│   │   ├── cart.js              # Shopping cart endpoints
│   │   ├── orders.js            # Order endpoints
│   │   └── admin.js             # Admin endpoints
│   └── utils/
│       ├── jwt.js               # JWT token utilities
│       ├── password.js          # Password hashing utilities
│       └── validation.js        # Input validation utilities
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── package.json                 # Project dependencies
└── README.md                    # This file
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and update with your configuration:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- Database credentials
- JWT secret
- CORS origin
- Port number

### 3. Set Up Database

Create PostgreSQL database:

```bash
createdb porky_market
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

### 5. Verify Server is Running

Visit `http://localhost:3000/health` to verify the server is running.

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload (requires nodemon)
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item
- `DELETE /api/cart/:itemId` - Remove cart item

### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order (admin)

### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

## Security Features

- **JWT Authentication**: Stateless authentication using JSON Web Tokens
- **CSRF Protection**: CSRF token validation on state-changing requests
- **Input Sanitization**: All inputs sanitized to prevent XSS attacks
- **Password Hashing**: Bcrypt for secure password storage
- **Rate Limiting**: API rate limiting to prevent abuse
- **Helmet**: Security headers via Helmet middleware
- **CORS**: Configurable CORS for frontend integration

## Environment Variables

```
NODE_ENV=development
PORT=3000
HOST=localhost

DATABASE_URL=postgresql://user:password@localhost:5432/porky_market
DB_HOST=localhost
DB_PORT=5432
DB_NAME=porky_market
DB_USER=postgres
DB_PASSWORD=password

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=7d

CORS_ORIGIN=http://localhost:8000

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

API_PREFIX=/api
```

## Development

### Adding New Routes

1. Create route file in `src/routes/`
2. Import and use in `src/index.js`
3. Use `asyncHandler` for error handling
4. Use authentication middleware as needed

### Adding New Middleware

1. Create middleware file in `src/middleware/`
2. Export middleware function
3. Use in `src/index.js` or specific routes

### Error Handling

All errors are caught by the global error handler. Use `AppError` for custom errors:

```javascript
import { AppError } from '../middleware/errorHandler.js';

throw new AppError('User not found', 404);
```

## Database

PostgreSQL database with connection pooling. Database schema will be created in Phase 3.

## Testing

Tests will be added in Phase 15. Currently, you can test endpoints using:

- Postman
- cURL
- Thunder Client
- REST Client VS Code extension

## Deployment

Backend can be deployed to:
- Cloud VMs (AWS EC2, DigitalOcean, Linode)
- Container services (Docker, Kubernetes)
- Serverless (AWS Lambda, Google Cloud Functions)

See deployment guide for detailed instructions.

## License

MIT
