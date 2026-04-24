# Backend Quick Start

## ✅ What's Done

The backend is **fully coded and ready**:
- ✅ All npm packages installed (423 packages)
- ✅ Express server with security (Helmet, CORS, rate limiting)
- ✅ JWT authentication with bcrypt password hashing
- ✅ Complete REST API (auth, products, orders, contact, admin)
- ✅ PostgreSQL schema with migrations and seed data
- ✅ Test suite (Jest + Supertest)
- ✅ Frontend integration (API calls + localStorage fallback)

**All code passes syntax validation** — the server is ready to run once the database is set up.

---

## 🚀 To Run the Backend

### Step 1: Install PostgreSQL

**Windows:**
```
Download from: https://www.postgresql.org/download/windows/
Run the installer → set a password for 'postgres' user → remember it!
```

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Linux:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create the Database

```bash
# Windows (from Command Prompt or PowerShell with execution policy bypassed):
createdb -U postgres porkys_db

# macOS/Linux:
createdb porkys_db
```

### Step 3: Configure Environment

```bash
cd backend
copy .env.example .env    # Windows
# OR
cp .env.example .env      # macOS/Linux
```

Edit `.env` and set:
```
DB_PASSWORD=your_postgres_password_here
JWT_SECRET=a_long_random_string_for_production
```

### Step 4: Run Migrations & Seed

```bash
npm run migrate    # Creates all 8 tables
npm run seed       # Inserts 6 categories + 14 products
```

### Step 5: Start the Server

```bash
npm run dev        # Development mode (auto-restart on changes)
# OR
npm start          # Production mode
```

The API will be at **http://localhost:3000**

---

## 🧪 Run Tests

```bash
npm test
```

Tests require a running PostgreSQL database (uses the same DB as dev).

---

## 🌐 Frontend Integration

The frontend (`js/services/api.js`) auto-detects the API:
- **Dev** (Live Server on :5500) → calls `http://localhost:3000/api`
- **Production** (Express serves frontend) → calls `/api`

**Fallback behavior:** If the API is unreachable, auth/cart/orders fall back to localStorage — so the frontend works standalone during development.

---

## 📊 API Endpoints

Once running, visit:
- **Health check:** http://localhost:3000/api/health
- **Products:** http://localhost:3000/api/products
- **Categories:** http://localhost:3000/api/products/categories
- **Featured:** http://localhost:3000/api/products/featured

Full API docs: see `backend/README.md`

---

## ⚡ Alternative: Frontend-Only Mode

**Don't want to install PostgreSQL right now?**

The frontend already works 100% standalone:
1. Open `index.html` with Live Server (VS Code extension)
2. Auth, cart, orders all use localStorage
3. All features functional without a backend

When you're ready for the full backend, follow the steps above.

---

## 🐛 Troubleshooting

**"psql: command not found"**
→ PostgreSQL not installed or not in PATH

**"npm: cannot be loaded because running scripts is disabled"**
→ Run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in PowerShell

**"Connection refused" or "ECONNREFUSED"**
→ PostgreSQL not running. Start it:
- Windows: Services → PostgreSQL → Start
- macOS: `brew services start postgresql@16`
- Linux: `sudo systemctl start postgresql`

**"database 'porkys_db' does not exist"**
→ Run: `createdb -U postgres porkys_db`

**"password authentication failed"**
→ Check `DB_PASSWORD` in `.env` matches your PostgreSQL password

---

## 📝 Summary

| Task | Status |
|------|--------|
| Backend code | ✅ Complete |
| npm packages | ✅ Installed |
| PostgreSQL | ⏳ Needs installation |
| Database setup | ⏳ Run `migrate` + `seed` after PostgreSQL is installed |
| Server ready | ✅ Can start once DB is configured |

**Next:** Install PostgreSQL → configure `.env` → `npm run migrate` → `npm run seed` → `npm run dev`
