# Environment Configuration - Quick Reference

## Quick Start

### Development
```bash
# Already configured - just run:
npm run dev
```

### Production
```bash
# Set environment variables, then:
npm start
```

## Environment Variables Cheat Sheet

### Server
```env
NODE_ENV=development          # development, staging, production
PORT=3000                     # Server port
HOST=localhost                # localhost or 0.0.0.0
```

### Database
```env
DB_HOST=localhost             # PostgreSQL host
DB_PORT=5432                  # PostgreSQL port
DB_NAME=porky_market          # Database name
DB_USER=postgres              # Database user
DB_PASSWORD=password          # Database password
```

### JWT
```env
JWT_SECRET=your_secret_key    # Generate: openssl rand -base64 32
JWT_EXPIRY=7d                 # 7d, 24h, 1h, etc.
```

### CORS
```env
CORS_ORIGIN=http://localhost:8000    # Frontend origin
```

### Rate Limiting
```env
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100   # Requests per window
```

### API
```env
API_PREFIX=/api               # API base path
```

### Email (Optional)
```env
SMTP_HOST=smtp.gmail.com      # SMTP server
SMTP_PORT=587                 # SMTP port
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

## Common Tasks

### Generate Secure JWT Secret
```bash
openssl rand -base64 32
```

### Generate Secure Database Password
```bash
openssl rand -base64 16
```

### View Current Configuration
```bash
# Development
cat backend/.env

# Production template
cat backend/.env.production
```

### Update Development Configuration
```bash
nano backend/.env
```

### Set Production Environment Variables (Linux/Mac)
```bash
export NODE_ENV=production
export JWT_SECRET=your_secure_secret
export DB_HOST=your_db_host
export DB_PORT=5432
export DB_NAME=porky_market_prod
export DB_USER=porky_app_user
export DB_PASSWORD=your_strong_password
export CORS_ORIGIN=https://porkymeatmarket.com
export API_PREFIX=/api
```

### Set Production Environment Variables (Windows PowerShell)
```powershell
$env:NODE_ENV = "production"
$env:JWT_SECRET = "your_secure_secret"
$env:DB_HOST = "your_db_host"
$env:DB_PORT = "5432"
$env:DB_NAME = "porky_market_prod"
$env:DB_USER = "porky_app_user"
$env:DB_PASSWORD = "your_strong_password"
$env:CORS_ORIGIN = "https://porkymeatmarket.com"
$env:API_PREFIX = "/api"
```

### Docker Deployment
```bash
docker run -e NODE_ENV=production \
  -e JWT_SECRET=your_secret \
  -e DB_HOST=db.example.com \
  -e DB_PORT=5432 \
  -e DB_NAME=porky_market_prod \
  -e DB_USER=porky_app_user \
  -e DB_PASSWORD=your_password \
  -e CORS_ORIGIN=https://porkymeatmarket.com \
  -p 3000:3000 \
  porky-api:latest
```

## Environment Profiles

### Development
```env
NODE_ENV=development
PORT=3000
HOST=localhost
DB_HOST=localhost
DB_PORT=5432
DB_NAME=porky_market
DB_USER=postgres
DB_PASSWORD=password
JWT_SECRET=dev_jwt_secret_key_porky_meat_market_development_only
JWT_EXPIRY=7d
CORS_ORIGIN=http://localhost:8000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
API_PREFIX=/api
```

### Staging
```env
NODE_ENV=staging
PORT=3000
HOST=0.0.0.0
DB_HOST=staging-db.example.com
DB_PORT=5432
DB_NAME=porky_market_staging
DB_USER=porky_app_user
DB_PASSWORD=strong_staging_password_min_16_chars
JWT_SECRET=staging_jwt_secret_generated_with_openssl_rand_base64_32
JWT_EXPIRY=24h
CORS_ORIGIN=https://staging.porkymeatmarket.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
API_PREFIX=/api
```

### Production
```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DB_HOST=prod-db.example.com
DB_PORT=5432
DB_NAME=porky_market_prod
DB_USER=porky_app_user
DB_PASSWORD=your_strong_production_password_here_min_16_chars
JWT_SECRET=your_production_jwt_secret_key_generated_with_openssl_rand_base64_32
JWT_EXPIRY=24h
CORS_ORIGIN=https://porkymeatmarket.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
API_PREFIX=/api
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL not running or wrong DB_HOST |
| `JsonWebTokenError: invalid token` | JWT_SECRET mismatch or token expired |
| `CORS policy blocked` | CORS_ORIGIN doesn't match frontend domain |
| `Too many requests` | Increase RATE_LIMIT_MAX_REQUESTS |
| `Database connection timeout` | Check DB_HOST, DB_PORT, firewall rules |

## Files Reference

| File | Purpose |
|------|---------|
| `.env.example` | Template with all variables |
| `.env` | Development configuration |
| `.env.production` | Production template |
| `ENV_SETUP_GUIDE.md` | Detailed guide |
| `ENV_CONFIGURATION.md` | Configuration overview |
| `ENVIRONMENT_SETUP_SUMMARY.md` | Setup summary |
| `ENV_QUICK_REFERENCE.md` | This file |

## Security Reminders

⚠️ **Never commit `.env` files to version control**
⚠️ **Use strong passwords in production (min 16 characters)**
⚠️ **Generate JWT_SECRET with: `openssl rand -base64 32`**
⚠️ **Rotate secrets regularly (every 90 days)**
⚠️ **Use secrets management system in production**
⚠️ **Restrict CORS_ORIGIN to known domains**

## More Information

- Full guide: `ENV_SETUP_GUIDE.md`
- Configuration details: `ENV_CONFIGURATION.md`
- Setup summary: `ENVIRONMENT_SETUP_SUMMARY.md`
- Template: `.env.example`
- Production template: `.env.production`
