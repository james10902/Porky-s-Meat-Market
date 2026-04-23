# Database Migrations

This directory contains SQL migration files that define the database schema for the Porky's Meat Market Platform.

## Migration Files

### 001_create_initial_schema.sql

**Description**: Creates the initial database schema with all required tables

**Tables Created**:
1. **users** - User account information with role-based access control
2. **products** - Product catalog with pricing and inventory
3. **orders** - Order management with status tracking
4. **order_items** - Order line items linking orders to products
5. **notifications** - User notifications for order updates

**Features**:
- Proper indexes for query optimization
- Foreign key constraints for referential integrity
- CHECK constraints for data validation
- Cascade/Restrict delete rules for data consistency
- Timestamp fields for audit trails

## Running Migrations

### Automatic (Recommended)

```bash
# From the backend directory
npm run migrate
```

### Manual

```bash
# Run specific migration
npm run migrate:file 001_create_initial_schema.sql

# Or using psql directly
psql -U postgres -d porky_market -f migrations/001_create_initial_schema.sql
```

## Migration Naming Convention

Migrations follow the naming pattern: `NNN_description.sql`

- `NNN` - Sequential version number (001, 002, 003, etc.)
- `description` - Brief description of what the migration does
- `.sql` - SQL file extension

Example: `001_create_initial_schema.sql`, `002_add_user_preferences.sql`

## Migration Best Practices

1. **Idempotent**: Use `IF NOT EXISTS` and `IF EXISTS` clauses
2. **Reversible**: Consider creating a corresponding down migration if needed
3. **Atomic**: Each migration should be a complete, self-contained change
4. **Documented**: Include comments explaining the purpose and structure
5. **Tested**: Test migrations in development before deploying to production

## Schema Overview

### Users Table
```
id (PK)
email (UNIQUE)
password_hash
name
role (RETAIL, B2B, HAWKER, ADMIN)
status (ACTIVE, INACTIVE, SUSPENDED)
created_at
updated_at
```

### Products Table
```
id (PK)
name
description
price
category
image_url
stock
created_at
updated_at
```

### Orders Table
```
id (PK)
user_id (FK → users)
order_number (UNIQUE)
status (PENDING, IN_COLD_STORAGE, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
total_amount
delivery_address
payment_method
created_at
updated_at
```

### Order Items Table
```
id (PK)
order_id (FK → orders, CASCADE)
product_id (FK → products)
quantity
price
created_at
```

### Notifications Table
```
id (PK)
user_id (FK → users, CASCADE)
order_id (FK → orders, SET NULL)
message
is_read
created_at
```

## Indexes

All tables include strategic indexes:

- **Primary Key Indexes**: Automatic on id columns
- **Foreign Key Indexes**: On user_id, order_id, product_id
- **Status/Role Indexes**: For filtering queries
- **Timestamp Indexes**: For date range queries
- **Composite Indexes**: For common query patterns

## Constraints

- **UNIQUE**: email, order_number
- **NOT NULL**: Required fields
- **CHECK**: Valid values for roles, statuses, prices, quantities
- **FOREIGN KEY**: Referential integrity
- **CASCADE/RESTRICT**: Proper deletion behavior

## Adding New Migrations

To add a new migration:

1. Create a new SQL file with the next sequential number
2. Follow the naming convention: `NNN_description.sql`
3. Include `IF NOT EXISTS` and `IF EXISTS` clauses for idempotency
4. Add comments explaining the changes
5. Test the migration in development
6. Run `npm run migrate` to apply it

Example:
```sql
-- Migration: 002_add_user_preferences.sql
-- Description: Adds user preferences table for storing user settings

CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(50) DEFAULT 'dark',
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
```

## Troubleshooting

### Migration Fails
- Check PostgreSQL is running and accessible
- Verify database connection details in `.env`
- Review error message for SQL syntax issues
- Check if tables already exist (use `IF NOT EXISTS`)

### Connection Issues
- Ensure PostgreSQL service is running
- Verify connection string in `.env`
- Check PostgreSQL user permissions
- Test connection: `psql -U postgres -d porky_market`

### Rollback
If a migration causes issues:
1. Identify the problematic migration
2. Create a new migration to fix the issue
3. Do NOT modify existing migrations
4. Document the issue and solution

## Performance Considerations

- Indexes are created on frequently queried columns
- Composite indexes optimize common query patterns
- CHECK constraints prevent invalid data at the database level
- Foreign key constraints maintain referential integrity
- Cascade delete rules prevent orphaned records

## Security Considerations

- Password hashes stored using bcrypt (not plain text)
- Email addresses are unique to prevent duplicates
- Role-based access control via role field
- Status field for account management
- Timestamps for audit trails

## Related Documentation

- [DATABASE_SETUP.md](../DATABASE_SETUP.md) - Complete database setup guide
- [src/config/database.js](../src/config/database.js) - Database connection configuration
- [scripts/run-migrations.js](../scripts/run-migrations.js) - Migration runner script
