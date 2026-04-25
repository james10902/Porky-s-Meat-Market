# PostgreSQL Database Options for Netlify Deployment

## Quick Comparison

| Service | Free Tier | Storage | Pros | Best For |
|---------|-----------|---------|------|----------|
| **Supabase** | ✅ 500MB | Unlimited API | Easy setup, includes auth, real-time | Most users |
| **Neon** | ✅ 3GB | 10GB/mo bandwidth | Serverless, branching, fast | Tech-savvy users |
| **Railway** | ✅ $5 credit | Included | Easy deployment, many services | Quick prototypes |
| **Render** | ✅ 1GB | Sleeps after 90d | Simple interface | Small projects |

## Recommended: Supabase

### Why Supabase?
1. **Easiest setup** - Web interface, no CLI needed
2. **Includes authentication** - Could replace your JWT auth
3. **Real-time features** - Live updates for orders
4. **Storage included** - 1GB for product images
5. **Good documentation** - Large community

### Setup Time: 10 minutes

## Alternative: Neon (Tech-Friendly)

### Why Neon?
1. **Serverless PostgreSQL** - Scales automatically
2. **Branching** - Create database branches for testing
3. **Better performance** - Optimized for serverless
4. **More storage** - 3GB free

### Setup Time: 15 minutes

## Local Development Setup

If you want to test locally first:

### Option A: Install PostgreSQL Locally
1. Download from [postgresql.org](https://www.postgresql.org/download/)
2. Run `setup-local-db.sql` in psql
3. Use connection: `postgresql://localhost:5432/porkys_db`

### Option B: Use Docker
```bash
docker run -d --name porkys-db -p 5432:5432 -e POSTGRES_PASSWORD=password postgres
```

## Quick Start Guide

### Step 1: Choose Provider
- **Beginners**: Use Supabase
- **Developers**: Use Neon  
- **Testing**: Use local PostgreSQL

### Step 2: Create Database
Follow the specific guide for your chosen provider.

### Step 3: Get Connection String
Format: `postgresql://username:password@host:port/database`

### Step 4: Run SQL Tables
Use the SQL from `setup-local-db.sql`

### Step 5: Configure Netlify
Add environment variables in Netlify dashboard.

## Connection Strings Examples

### Supabase
```
postgresql://postgres:[YOUR_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### Neon
```
postgresql://[USERNAME]:[PASSWORD]@[ENDPOINT]/[DATABASE]
```

### Local
```
postgresql://localhost:5432/porkys_db
```

## Testing Your Setup

1. **Health check**: `https://yoursite.netlify.app/api/health`
2. **Should return**: `{"status":"ok","db":"connected"}`

3. **Test registration**: POST to `/api/auth/register`
4. **Test products**: GET `/api/products`

## Troubleshooting

### Common Issues:
1. **Connection refused**: Check firewall, network access
2. **Authentication failed**: Verify username/password
3. **Database not found**: Ensure database exists
4. **SSL required**: Add `?sslmode=require` to connection string

### For Supabase:
- Enable "Allow connections from all IPs" in Network Settings
- Check project is not paused (free tier)

### For Netlify:
- Environment variables are case-sensitive
- Redeploy after changing variables
- Check function logs in Netlify dashboard

## Next Steps After Database Setup

1. **Deploy to Netlify**
2. **Test all API endpoints**
3. **Add more sample products**
4. **Set up email notifications** (optional)
5. **Configure payment gateway** (optional)

## Need Help?
- Supabase: [Discord](https://discord.supabase.com)
- Neon: [Discord](https://discord.gg/neondatabase)
- Netlify: [Community](https://answers.netlify.com)