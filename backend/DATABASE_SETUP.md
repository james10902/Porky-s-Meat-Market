# Database Setup Guide

This guide explains how to set up the PostgreSQL database for the Porky's Meat Market Platform.

## Prerequisites

- PostgreSQL 12 or higher installed and running
- Node.js 16 or higher
- Environment variables configured in `.env` file

## Database Configuration

### 1. Create PostgreSQL Database

First, create the PostgreSQL database using the credentials in your `.env` file:

```bash
# Using psql command line
psql -U postgres -c "CREATE DATABASE porky_market;"

# Or using a GUI tool like pgAdmin
# Create a new database named "porky_market"
```

### 2. Configure Environment Variables

Update your `.env` file with your PostgreSQL connection details:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/porky_market
DB_HOST=localhost
DB_PORT=5432
DB_NAME=porky_market
DB_USER=postgres
DB_PASSWORD=password
```

## Running Migrations

### Automatic Migration (Recommended)

Run all migrations automatically using the migration runner script:

```bash
# From the backend directory
node scripts/run-migrations.js
```

This will:
1. Connect to the PostgreSQL database
2. Execute all SQL migration files in the `migrations/` directory
3. Create all required tables with proper indexes and constraints
4. Display success/failure messages for each migration

### Manual Migration

If you prefer to run migrations manually:

```bash
# Connect to PostgreSQL
psql -U postgres -d porky_market -f migrations/001_create_initial_schema.sql
```

### Run Specific Migration

To run a specific migration file:

```bash
node scripts/run-migrations.js --file 001_create_initial_schema.sql
```

## Database Schema

The migration creates the following tables:

### Users Table
- Stores user account information
- Supports multiple roles: RETAIL, B2B, HAWKER, ADMIN
- Includes email, password hash, name, role, and status fields
- Indexes on email, role, status, and created_at for efficient queries

### Products Table
- Stores product catalog information
- Includes name, description, price, category, image URL, and stock
- Indexes on category, name, price, stock, and created_at
- Price and stock have CHECK constraints to ensure valid values

### Orders Table
- Stores order information for order management and tracking
- Links to users table via user_id
- Order status flow: PENDING → IN_COLD_STORAGE → OUT_FOR_DELIVERY → DELIVERED
- Includes order number, total amount, delivery address, and payment method
- Indexes on user_id, order_number, status, and created_at

### Order Items Table
- Stores individual line items for each order
- Links orders to products with quantity and pricing
- Cascade delete on order deletion
- Indexes on order_id, product_id, and created_at

### Notifications Table
- Stores user notifications for order status changes
- Links to users and orders tables
- Includes message and is_read flag for tracking read status
- Indexes on user_id, order_id, is_read, and created_at

## Indexes

All tables include strategic indexes for optimal query performance:

- **Primary Key Indexes**: Automatically created on id columns
- **Foreign Key Indexes**: Improve JOIN performance
- **Status/Role Indexes**: Speed up filtering queries
- **Timestamp Indexes**: Enable efficient date range queries
- **Composite Indexes**: Optimize common query patterns (e.g., user_id + created_at)

## Constraints

The schema includes several constraints to maintain data integrity:

- **UNIQUE Constraints**: Email (users), order_number (orders)
- **NOT NULL Constraints**: Required fields like email, password_hash, name
- **CHECK Constraints**: Valid values for roles, statuses, prices, quantities
- **FOREIGN KEY Constraints**: Referential integrity between tables
- **CASCADE/RESTRICT**: Proper deletion behavior for related records

## Sample Data (Optional)

To insert sample data for development/testing, uncomment the sample data section in the migration file:

```sql
INSERT INTO users (email, password_hash, name, role, status) VALUES
('retail@example.com', '$2a$10$...', 'Retail Customer', 'RETAIL', 'ACTIVE'),
('b2b@example.com', '$2a$10$...', 'B2B Buyer', 'B2B', 'ACTIVE'),
('hawker@example.com', '$2a$10$...', 'Hawker Vendor', 'HAWKER', 'ACTIVE'),
('admin@example.com', '$2a$10$...', 'Administrator', 'ADMIN', 'ACTIVE');
```

Note: Replace the password hashes with actual bcrypt hashes of your passwords.

## Verifying the Schema

After running migrations, verify the schema was created correctly:

```bash
# Connect to the database
psql -U postgres -d porky_market

# List all tables
\dt

# Describe a specific table
\d users
\d products
\d orders
\d order_items
\d notifications

# List all indexes
\di

# Exit psql
\q
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Check connection details in `.env` file
- Verify PostgreSQL is listening on the correct port (default 5432)

### Database Already Exists
- Drop the existing database: `psql -U postgres -c "DROP DATABASE porky_market;"`
- Then create a new one and run migrations

### Permission Denied
- Ensure the PostgreSQL user has proper permissions
- Create a new user if needed: `psql -U postgres -c "CREATE USER porky_user WITH PASSWORD 'password';"`
- Grant privileges: `psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE porky_market TO porky_user;"`

### Migration Fails
- Check the error message for specific SQL syntax issues
- Verify all migration files are in the `migrations/` directory
- Ensure the database connection is working: `node -e "import('./src/config/database.js').then(() => console.log('Connected'))"`

## Backup and Restore

### Backup Database
```bash
pg_dump -U postgres -d porky_market -f backup.sql
```

### Restore Database
```bash
psql -U postgres -d porky_market -f backup.sql
```

## Performance Optimization

The schema includes several performance optimizations:

1. **Strategic Indexes**: Indexes on frequently queried columns
2. **Composite Indexes**: Combined indexes for common query patterns
3. **CHECK Constraints**: Prevent invalid data at the database level
4. **Connection Pooling**: Configured in database.js for efficient connections
5. **Query Logging**: Development mode logs query execution times

## Next Steps

After setting up the database:

1. Start the backend server: `npm run dev`
2. Verify the database connection in the console output
3. Implement API endpoints to interact with the database
4. Add authentication and authorization middleware
5. Create API routes for products, orders, and users

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Library](https://node-postgres.com/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)
