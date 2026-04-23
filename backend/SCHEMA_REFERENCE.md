# Database Schema Reference

Quick reference guide for the Porky's Meat Market Platform database schema.

## Table Structure

### Users Table
Stores user account information with role-based access control.

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

**Columns**:
- `id`: Unique user identifier
- `email`: User email (unique, used for login)
- `password_hash`: Bcrypt hashed password
- `name`: User's full name
- `role`: User role (RETAIL, B2B, HAWKER, ADMIN)
- `status`: Account status (ACTIVE, INACTIVE, SUSPENDED)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

**Indexes**: email, role, status, created_at

---

### Products Table
Stores product catalog information.

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

**Columns**:
- `id`: Unique product identifier
- `name`: Product name
- `description`: Product description
- `price`: Product price (NAD currency)
- `category`: Product category (e.g., Beef, Poultry, Pork)
- `image_url`: URL to product image
- `stock`: Available inventory quantity
- `created_at`: Product creation timestamp
- `updated_at`: Last update timestamp

**Indexes**: category, name, price, stock, created_at

---

### Orders Table
Stores order information for order management and tracking.

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

**Columns**:
- `id`: Unique order identifier
- `user_id`: Reference to user who placed the order
- `order_number`: Unique order number (e.g., ORD-20240115-001)
- `status`: Order status (PENDING, IN_COLD_STORAGE, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
- `total_amount`: Total order amount (NAD currency)
- `delivery_address`: Full delivery address
- `payment_method`: Payment method used (e.g., CARD, MOBILE_MONEY)
- `created_at`: Order creation timestamp
- `updated_at`: Last update timestamp

**Indexes**: user_id, order_number, status, created_at, (user_id, created_at)

**Status Flow**: PENDING → IN_COLD_STORAGE → OUT_FOR_DELIVERY → DELIVERED

---

### Order Items Table
Stores individual line items for each order.

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id`: Unique order item identifier
- `order_id`: Reference to the order
- `product_id`: Reference to the product
- `quantity`: Quantity ordered
- `price`: Price per unit at time of order
- `created_at`: Item creation timestamp

**Indexes**: order_id, product_id, created_at

**Relationships**:
- Cascade delete on order deletion (removes all items)
- Restrict delete on product (prevents deleting products with orders)

---

### Notifications Table
Stores user notifications for order status changes and system messages.

```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
- `id`: Unique notification identifier
- `user_id`: Reference to the user receiving the notification
- `order_id`: Reference to related order (optional)
- `message`: Notification message text
- `is_read`: Whether the notification has been read
- `created_at`: Notification creation timestamp

**Indexes**: user_id, order_id, is_read, created_at, (user_id, is_read)

---

## Common Queries

### Get User with Orders
```sql
SELECT u.*, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.id = $1
GROUP BY u.id;
```

### Get Order with Items
```sql
SELECT o.*, 
       json_agg(json_build_object(
         'id', oi.id,
         'product_id', oi.product_id,
         'product_name', p.name,
         'quantity', oi.quantity,
         'price', oi.price
       )) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.id = $1
GROUP BY o.id;
```

### Get Unread Notifications
```sql
SELECT * FROM notifications
WHERE user_id = $1 AND is_read = FALSE
ORDER BY created_at DESC;
```

### Get Products by Category
```sql
SELECT * FROM products
WHERE category = $1 AND stock > 0
ORDER BY name ASC;
```

### Get Recent Orders
```sql
SELECT * FROM orders
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 10;
```

---

## Data Types

| Type | Usage | Example |
|------|-------|---------|
| SERIAL | Auto-incrementing integer | id |
| VARCHAR(n) | Variable-length string | email, name, category |
| TEXT | Long text | description, delivery_address |
| DECIMAL(10,2) | Fixed-point decimal | price, total_amount |
| INTEGER | Whole number | stock, quantity |
| BOOLEAN | True/False | is_read |
| TIMESTAMP | Date and time | created_at, updated_at |

---

## Constraints

| Constraint | Purpose | Example |
|-----------|---------|---------|
| PRIMARY KEY | Unique identifier | id SERIAL PRIMARY KEY |
| UNIQUE | Ensure uniqueness | email VARCHAR(255) UNIQUE |
| NOT NULL | Require value | name VARCHAR(255) NOT NULL |
| CHECK | Validate values | role VARCHAR(50) CHECK (role IN (...)) |
| FOREIGN KEY | Reference other table | user_id INTEGER REFERENCES users(id) |
| DEFAULT | Set default value | status VARCHAR(50) DEFAULT 'ACTIVE' |

---

## Relationships

```
users (1) ──→ (many) orders
users (1) ──→ (many) notifications
products (1) ──→ (many) order_items
orders (1) ──→ (many) order_items
orders (1) ──→ (many) notifications
```

---

## Performance Tips

1. **Use Indexes**: All frequently queried columns have indexes
2. **Composite Indexes**: Use (user_id, created_at) for user-specific date queries
3. **Parameterized Queries**: Always use $1, $2, etc. to prevent SQL injection
4. **Connection Pooling**: Configured in database.js for efficiency
5. **Query Optimization**: Use EXPLAIN ANALYZE to identify slow queries

---

## Backup and Maintenance

### Backup Database
```bash
pg_dump -U postgres -d porky_market > backup.sql
```

### Restore Database
```bash
psql -U postgres -d porky_market < backup.sql
```

### Check Table Sizes
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Analyze Query Performance
```sql
EXPLAIN ANALYZE
SELECT * FROM orders WHERE user_id = 1 ORDER BY created_at DESC;
```

---

## Security Considerations

1. **Password Hashing**: Always hash passwords with bcrypt before storing
2. **Parameterized Queries**: Use $1, $2 placeholders to prevent SQL injection
3. **Role-Based Access**: Check user role before allowing operations
4. **Audit Trail**: Timestamps track when records are created/updated
5. **Data Validation**: CHECK constraints enforce valid values at database level

---

## Related Files

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Setup instructions
- [migrations/001_create_initial_schema.sql](./migrations/001_create_initial_schema.sql) - Migration file
- [migrations/README.md](./migrations/README.md) - Migration documentation
- [src/config/database.js](./src/config/database.js) - Database connection
