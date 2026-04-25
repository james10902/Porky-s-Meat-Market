# Netlify Deployment Guide for Porky's Meat Market

## Overview
This project has been converted to use Netlify Functions (serverless) for the backend API. The frontend remains static HTML/CSS/JS.

## Project Structure
```
netlify/
├── functions/
│   ├── auth.js          # /api/auth/* endpoints
│   ├── products.js      # /api/products/* endpoints
│   ├── orders.js        # /api/orders/* endpoints
│   ├── contact.js       # /api/contact/* endpoints
│   ├── health.js        # /api/health endpoint
│   ├── db.js            # Database connection
│   ├── middleware.js    # Shared middleware utilities
│   └── package.json     # Function dependencies
netlify.toml             # Netlify configuration
```

## Deployment Steps

### 1. Set up PostgreSQL Database
You need a PostgreSQL database for the backend. Options:
- **Supabase** (free tier): https://supabase.com
- **Neon** (free tier): https://neon.tech
- **Railway** (free tier): https://railway.app
- **Render** (free tier): https://render.com

### 2. Configure Environment Variables in Netlify
Go to your Netlify site settings > Environment variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=your_long_random_secret_string_here
ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
NODE_ENV=production
```

### 3. Deploy to Netlify
1. Push your code to GitHub/GitLab
2. Connect your repository to Netlify
3. Netlify will automatically detect the `netlify.toml` configuration
4. Build will run automatically

### 4. Database Setup
Run these SQL commands to create the necessary tables:

```sql
-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100),
    image_url VARCHAR(500),
    featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    shipping_address TEXT,
    payment_method VARCHAR(50),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    cancelled_at TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Contact messages table
CREATE TABLE contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Wholesale inquiries table
CREATE TABLE wholesale_inquiries (
    id SERIAL PRIMARY KEY,
    business_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    business_type VARCHAR(100),
    requirements TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Testing the Deployment
1. Visit your Netlify site: `https://your-site.netlify.app`
2. Check health endpoint: `https://your-site.netlify.app/api/health`
3. Test API endpoints using Postman or curl

## Development
For local development:

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Set local environment variables in `.env` file:
```
DATABASE_URL=postgresql://localhost:5432/porkys_db
JWT_SECRET=local_secret
ALLOWED_ORIGINS=http://localhost:8888
NODE_ENV=development
```

3. Run locally:
```bash
netlify dev
```

## Notes
- The frontend API calls are configured to use `/api/*` URLs
- Netlify redirects `/api/*` to `/.netlify/functions/*`
- CORS is configured to allow your Netlify domain
- Database connection uses connection pooling optimized for serverless
- JWT authentication is implemented for protected routes

## Troubleshooting
1. **Database connection errors**: Check `DATABASE_URL` format and network access
2. **CORS errors**: Verify `ALLOWED_ORIGINS` includes your Netlify domain
3. **Function timeouts**: Netlify Functions have a 10-second timeout by default
4. **Missing tables**: Run the SQL setup commands above