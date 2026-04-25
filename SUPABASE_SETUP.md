# Supabase PostgreSQL Database Setup Guide

## Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email
4. Click "New Project"

## Step 2: Create Project
1. Enter project name: `porkys-meat-market`
2. Enter database password (save this!)
3. Choose region closest to your users
4. Click "Create new project"

## Step 3: Get Connection String
1. Go to **Project Settings > Database**
2. Find "Connection string" section
3. Copy the **URI** (looks like: `postgresql://postgres:[password]@[host]:5432/postgres`)
4. Save this for Netlify environment variables

## Step 4: Create Tables
1. Go to **SQL Editor** in Supabase dashboard
2. Click "New query"
3. Copy and paste the SQL below
4. Click "Run"

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

## Step 5: Add Sample Data (Optional)
```sql
-- Insert sample products
INSERT INTO products (name, description, price, category, image_url, featured) VALUES
('Beef Mince', 'Premium quality beef mince, perfect for burgers and meatballs', 120.00, 'Beef', 'assets/Images/Beef mince.jpg', true),
('Beef Stew', 'Tender beef stew cuts, ideal for slow cooking', 150.00, 'Beef', 'assets/Images/Beef Stew.jpg', true),
('Chicken Breast', 'Boneless chicken breast, skinless', 95.00, 'Chicken', 'assets/Images/Chicken Breast Bone.jpg', true),
('Pork Lion Chops', 'Premium pork lion chops', 110.00, 'Pork', 'assets/Images/Pork Lion Chops.jpg', true),
('Droëwors', 'Traditional South African dried sausage', 180.00, 'Processed', 'assets/Images/Droewors.jpg', true);

-- Create a test user (password: test123)
INSERT INTO users (firstname, lastname, email, password_hash, role) VALUES
('Test', 'User', 'test@porkys.com', '$2a$12$YourHashedPasswordHere', 'customer');
```

## Step 6: Configure Netlify Environment Variables
1. Go to your Netlify site dashboard
2. Go to **Site settings > Environment variables**
3. Add these variables:

```
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:5432/postgres
JWT_SECRET=your_long_random_secret_string_here_change_this
ALLOWED_ORIGINS=https://your-netlify-site.netlify.app
NODE_ENV=production
```

## Step 7: Test Database Connection
1. Deploy to Netlify
2. Visit: `https://your-site.netlify.app/api/health`
3. Should return: `{"status":"ok","db":"connected",...}`

## Troubleshooting

### Connection Issues
1. **Error: "password authentication failed"**
   - Check your database password in Supabase
   - Reset password in Supabase Project Settings > Database

2. **Error: "could not translate host name"**
   - Check DATABASE_URL format
   - Ensure network access is enabled in Supabase

3. **Error: "timeout"**
   - Check Supabase project region
   - Ensure project is not paused (free tier pauses after 1 week inactivity)

### Security Notes
1. **Never commit DATABASE_URL or JWT_SECRET** to GitHub
2. **Use strong passwords** for database
3. **Enable Row Level Security** in Supabase for production
4. **Regularly backup** your database

## Additional Supabase Features
- **Authentication**: Supabase has built-in auth you could use instead of JWT
- **Storage**: Free 1GB for product images
- **Realtime**: Listen to database changes in real-time
- **Edge Functions**: Serverless functions (alternative to Netlify Functions)

## Support
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Netlify Docs: https://docs.netlify.com