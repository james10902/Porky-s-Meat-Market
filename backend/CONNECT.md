# Connect to PostgreSQL

## What You Need

The **postgres user password** you set when you installed PostgreSQL.

If you don't remember it, you have two options:

---

## Option 1: Use Your Password

Edit `backend/.env` and set:
```
DB_PASSWORD=your_actual_password_here
```

Then run:
```bash
cd backend
node scripts/setup.js
```

---

## Option 2: Reset the Password

If you forgot your password, reset it:

### Windows:

1. Open **pgAdmin 4** (installed with PostgreSQL)
2. Right-click **PostgreSQL 18** → **Properties**
3. Go to **Definition** tab
4. Set a new password
5. Save

**OR** via command line:

```cmd
"C:\Program Files\PostgreSQL\18\bin\psql" -U postgres -c "ALTER USER postgres PASSWORD 'newpassword';"
```

(You'll be prompted for the current password — if you don't know it, use pgAdmin)

---

## Option 3: Allow Trust Authentication (Dev Only)

**⚠️ Only for local development — never in production**

1. Open: `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
2. Find the line:
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   ```
3. Change `scram-sha-256` to `trust`:
   ```
   host    all             all             127.0.0.1/32            trust
   ```
4. Restart PostgreSQL:
   ```
   net stop postgresql-x64-18
   net start postgresql-x64-18
   ```
5. Update `backend/.env`:
   ```
   DB_PASSWORD=
   ```
6. Run setup:
   ```bash
   node scripts/setup.js
   ```

---

## Quick Test

Once you have the password set in `.env`, test the connection:

```bash
cd backend
node scripts/setup.js
```

You should see:
```
✅ Connected to PostgreSQL
✅ Database "porkys_db" created
✅ All tables created
✅ Seeded 6 categories and 14 products
✅ DATABASE READY
```

Then start the server:
```bash
npm run dev
```

The API will be live at **http://localhost:3000**

---

## What Password Should I Use?

**If you just installed PostgreSQL today:**
- The installer asked you to set a password for the `postgres` user
- Use that password in `backend/.env`

**If PostgreSQL was installed a while ago:**
- Check your notes or password manager
- Or reset it using pgAdmin (see Option 2 above)

**Common defaults** (try these if unsure):
- `postgres`
- `admin`
- `root`
- `password`
- `12345`

---

## Still Stuck?

Tell me the password and I'll update `.env` and run the setup for you.

Or if you want to use trust authentication (no password), I can guide you through editing `pg_hba.conf`.
