# Quick Start: Database Setup

Get your database up and running in 5 minutes.

## Prerequisites

- PostgreSQL installed and running
- Node.js 16+ installed
- Backend dependencies installed (`npm install`)

## Step 1: Create Database

```bash
# Create the PostgreSQL database
psql -U postgres -c "CREATE DATABASE porky_market;"
```

## Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your database credentials
# Default values should work if PostgreSQL is running locally:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=porky_market
# DB_USER=postgres
# DB_PASSWORD=password
```

## Step 3: Run Migrations

```bash
# From the backend directory
npm run migrate
```

You should see output like:
```
🚀 Starting database migrations...
📁 Migrations directory: /path/to/backend/migrations
📊 Found 1 migration(s) to execute

📋 Executing migration: 001_create_initial_schema.sql
✅ Migration completed successfully: 001_create_initial_schema.sql

✨ All migrations completed successfully!
```

## Step 4: Verify Setup

```bash
# Connect to the database and list tables
psql -U postgres -d porky_market -c "\dt"

# You should see:
# users
# products
# orders
# order_items
# notifications
```

## Step 5: Start Backend Server

```bash
# Start the development server
npm run dev

# You should see:
# ✓ Database connection pool created
# Server running on http://localhost:3000
```

## Done! 🎉

Your database is now set up and ready to use.

## Common Commands

```bash
# Run all migrations
npm run migrate

# Run specific migration
npm run migrate:file 001_create_initial_schema.sql

# Connect to database
psql -U postgres -d porky_market

# Backup database
pg_dump -U postgres -d porky_market > backup.sql

# Restore database
psql -U postgres -d porky_market < backup.sql
```

## Troubleshooting

### "Connection refused"
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Check connection details in `.env`

### "Database does not exist"
- Create it: `psql -U postgres -c "CREATE DATABASE porky_market;"`

### "Permission denied"
- Check PostgreSQL user permissions
- Verify credentials in `.env`

### "Migration failed"
- Check error message for SQL syntax issues
- Verify database connection is working
- Check that migration files exist in `migrations/` directory

## Next Steps

1. Review [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed setup guide
2. Check [SCHEMA_REFERENCE.md](./SCHEMA_REFERENCE.md) for database schema details
3. Start implementing API endpoints
4. Add sample data for testing

## Need Help?

- See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for comprehensive setup guide
- See [SCHEMA_REFERENCE.md](./SCHEMA_REFERENCE.md) for schema details
- See [migrations/README.md](./migrations/README.md) for migration details
