# Backend Setup Guide

## Prerequisites

You need:
- **Node.js 18+** (you have v24.15.0 ✅)
- **npm** (you have v11.12.1 ✅)
- **PostgreSQL 14+** (not installed yet ❌)

---

## Option 1: Full PostgreSQL Setup (Recommended for Production)

### Install PostgreSQL on Windows

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer (includes pgAdmin GUI)
3. During installation:
   - Set a password for the `postgres` user (remember this!)
   - Default port 5432 is fine
   - Install Stack Builder components (optional)

4. After installation, add PostgreSQL to your PATH:
   ```
   C:\Program Files\PostgreSQL\16\bin
   ```

5. Verify installation:
   ```bash
   psql --version
   ```

### Set up the database

```bash
# 1. Create the database
createdb -U postgres porkys_db

# 2. Configure environment
cd backend
copy .env.example .env
# Edit .env — set DB_PASSWORD to your postgres password

# 3. Run migrations
npm run migrate

# 4. Seed data
npm run seed

# 5. Start the server
npm run dev
```

---

## Option 2: SQLite (Quick Start, No PostgreSQL Needed)

If you want to test the backend immediately without installing PostgreSQL, I can convert it to use SQLite instead. SQLite is:
- ✅ Zero-config (no separate database server)
- ✅ File-based (stores everything in `backend/database.sqlite`)
- ✅ Perfect for development and testing
- ⚠️ Not recommended for production (no concurrent writes)

**Would you like me to convert the backend to SQLite?**

---

## Option 3: Frontend-Only Mode (Current State)

The frontend already works standalone without any backend:
- ✅ Auth uses localStorage
- ✅ Cart uses localStorage
- ✅ Orders save to localStorage
- ✅ Dashboard reads from localStorage
- ✅ All features functional

You can use the site right now by opening `index.html` with Live Server.

---

## Current Status

| Component | Status |
|-----------|--------|
| Backend code | ✅ Complete |
| npm packages | ✅ Installed (423 packages) |
| PostgreSQL | ❌ Not installed |
| Database schema | ✅ Ready (migrate.js) |
| Seed data | ✅ Ready (seed.js) |
| Tests | ✅ Ready (Jest configured) |
| Frontend integration | ✅ API calls + localStorage fallback |

---

## Next Steps

**Choose one:**

1. **Install PostgreSQL** → follow Option 1 above → full production-ready backend
2. **Convert to SQLite** → I'll rewrite the DB layer → instant backend, no install needed
3. **Use frontend-only** → everything works via localStorage → no backend needed for now

Let me know which path you prefer!
