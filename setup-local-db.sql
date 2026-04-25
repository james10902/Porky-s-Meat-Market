-- Local PostgreSQL Setup for Porky's Meat Market
-- Run these commands in psql or pgAdmin

-- Create database
CREATE DATABASE porkys_db;

-- Connect to database (run this in psql: \c porkys_db)

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

-- Insert sample products
INSERT INTO products (name, description, price, category, image_url, featured) VALUES
('Beef Mince', 'Premium quality beef mince, perfect for burgers and meatballs', 120.00, 'Beef', 'assets/Images/Beef mince.jpg', true),
('Beef Stew', 'Tender beef stew cuts, ideal for slow cooking', 150.00, 'Beef', 'assets/Images/Beef Stew.jpg', true),
('Beef Wors', 'Traditional beef sausage', 130.00, 'Beef', 'assets/Images/Beef Wors.jpg', true),
('Big Polonies', 'Large polony rolls', 85.00, 'Processed', 'assets/Images/Big polonies.jpg', true),
('Chicken Breast Bone', 'Chicken breast with bone', 90.00, 'Chicken', 'assets/Images/Chicken Breast Bone.jpg', true),
('Chicken Feet', 'Chicken feet for stews', 45.00, 'Chicken', 'assets/Images/Chicken Feet.jpg', false),
('Chicken Leg Quarters', 'Chicken leg quarters', 75.00, 'Chicken', 'assets/Images/Chicken Leg Quatres.jpg', true),
('Chicken Liver', 'Fresh chicken liver', 55.00, 'Chicken', 'assets/Images/Chicken Liver.jpg', false),
('Chicken Necks', 'Chicken necks for soup', 40.00, 'Chicken', 'assets/Images/Chicken Necks.jpg', false),
('Chicken Soup Pack', 'Assorted chicken parts for soup', 65.00, 'Chicken', 'assets/Images/Chicken Soup Pack.jpg', true),
('Droëwors', 'Traditional South African dried sausage', 180.00, 'Processed', 'assets/Images/Droewors.jpg', true),
('Game Stew', 'Venison stew meat', 200.00, 'Game', 'assets/Images/Game stew.jpg', true),
('Mini Polony', 'Small polony rolls', 70.00, 'Processed', 'assets/Images/Mini polony.jpg', false),
('Pork Lion Chops', 'Premium pork lion chops', 110.00, 'Pork', 'assets/Images/Pork Lion Chops.jpg', true),
('Pork Shoulder Chops', 'Pork shoulder chops', 95.00, 'Pork', 'assets/Images/Pork Shoulder chops.jpg', true);

-- Create a test user (password: test123 - hash for testing only)
INSERT INTO users (firstname, lastname, email, password_hash, role) VALUES
('John', 'Doe', 'john@example.com', '$2a$12$KcT7lT8mNQ9qYwZzXvWw3eBcDdEfFgGhHiJkKl', 'customer'),
('Admin', 'User', 'admin@porkys.com', '$2a$12$KcT7lT8mNQ9qYwZzXvWw3eBcDdEfFgGhHiJkKl', 'admin');

-- Create a test order
INSERT INTO orders (user_id, shipping_address, payment_method, total_amount, status) VALUES
(1, '123 Test Street, Windhoek', 'cash', 240.00, 'pending');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 2, 120.00);

-- Display tables
SELECT 'Database setup complete!' as message;
SELECT 'Tables created:' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;