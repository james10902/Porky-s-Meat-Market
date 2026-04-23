# Environment Configuration for Porky's Meat Market Backend

## Overview

This document provides a comprehensive guide to setting up and managing environment variables for the Porky's Meat Market backend API. Environment variables allow the same codebase to run in different environments (development, staging, production) with different configurations.

## Files in This Directory

### `.env.example`
- **Purpose**: Template file showing all available environment variables
- **Usage**: Reference for what variables are available and their descriptions
- **Status**: Safe to commit to version control
- **Content**: Includes detailed comments explaining each variable

### `.env`
- **Purpose**: Development environment configuration
- **Usage**: Loaded by the application at startup
- **Status**: Should NOT be committed to version control (add to .gitignore)
- **Content**: Development-specific values (localhost, weak passwords, etc.)

### `.env.production`
- **Purpose**: Production environment configuration template
- **Usage**: Reference for production deployment
- **Status**: Should NOT be committed to version control
- **Content**: Production-specific values (strong passwords, production hosts, etc.)

### `ENV_SETUP_GUIDE.md`
- **Purpose**: Detailed guide for environment configuration
- **Usage**: Reference for understanding each variable
- **Content**: Descriptions, examples, security best practices

## Quick Start

### 1. Development Setup

The `.env` file is already configured with development defaults. No additional setup is required for local development:

```bash
# Start the development server
npm run dev
```

The application will automatically load variables from `.env`.

### 2. Production Deployment

For production deployment:

```bash
# 1. Review the production template
cat backend/.env.production

# 2. Set environment variables (method depends on your deployment platform)
# Option A: Using environment variables directly
export NODE_ENV=production
export PORT=3000
export DB_HOST=your_production_db_host
# ... set all other variables

# Option B: Using a secrets management system
# AWS Secrets Manager, HashiCorp Vault, Azure Key Vault, etc.

# 3. Start the production server
npm start
```

## Environment Variables Summary

### Server Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Application environment (development, staging, production) |
| `PORT` | `3000` | Server port number |
| `HOST` | `localhost` | Server hostname/IP to bind to |

### Database Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `localhost` | PostgreSQL server hostname |
| `DB_PORT` | `5432` | PostgreSQL server port |
| `DB_NAME` | `porky_market` | Database name |
| `DB_USER` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `password` | PostgreSQL password |

### JWT Authentication
| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET` | `your_jwt_secret_key_here_change_in_production` | Secret key for signing JWT tokens |
| `JWT_EXPIRY` | `7d` | Token expiration time |

### CORS Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGIN` | `http://localhost:8000` | Allowed frontend origin(s) |

### Rate Limiting
| Variable | Default | Description |
|----------|---------|-------------|
| `RATE_LIMIT_WINDOW_MS` | `900000` | Rate limit time window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

### API Configuration
| Variable | Default | Description |
|----------|---------|-------------|
| `API_PREFIX` | `/api` | Base path for API endpoints |

### Email Configuration (Optional)
| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP server port |
| `SMTP_USER` | `your_email@gmail.com` | SMTP username |
| `SMTP_PASSWORD` | `your_app_password` | SMTP password |

## Security Considerations

### Development
- ✅ Use weak passwords for convenience
- ✅ Use localhost for all services
- ✅ Store secrets in `.env` file (not committed)
- ✅ Enable debug logging

### Production
- ⚠️ Use strong passwords (min 16 characters)
- ⚠️ Use secure, random JWT_SECRET
- ⚠️ Restrict CORS_ORIGIN to known domains
- ⚠️ Use separate database
- ⚠️ Store secrets in secrets management system
- ⚠️ Enable monitoring and alerting
- ⚠️ Use HTTPS only
- ⚠️ Rotate secrets regularly

## Generating Secure Secrets

### JWT_SECRET

Generate a secure JWT secret:

```bash
# Using OpenSSL
openssl rand -base64 32

# Example output:
# aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcdefghijklmnop
```

### Database Password

Generate a secure database password:

```bash
# Using OpenSSL
openssl rand -base64 16

# Example output:
# aBcDeFgHiJkLmNoPqRs
```

## Environment-Specific Examples

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
```

## Deployment Platforms

### Heroku

```bash
# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_secure_secret
heroku config:set DB_HOST=your_db_host
# ... set all other variables

# View all variables
heroku config
```

### AWS Lambda / Elastic Beanstalk

```bash
# Using AWS Secrets Manager
aws secretsmanager create-secret --name porky-api-secrets \
  --secret-string '{"JWT_SECRET":"...","DB_PASSWORD":"..."}'

# Reference in application code
import { SecretsManager } from 'aws-sdk';
```

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Run with environment variables
docker run -e NODE_ENV=production \
  -e JWT_SECRET=your_secret \
  -e DB_HOST=db.example.com \
  -p 3000:3000 \
  porky-api:latest
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: porky_market
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
    depends_on:
      - postgres
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: porky_market
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Troubleshooting

### Database Connection Errors

**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
1. Verify PostgreSQL is running
2. Check DB_HOST and DB_PORT are correct
3. Verify database exists
4. Check database user and password

### JWT Token Errors

**Error**: `JsonWebTokenError: invalid token`

**Solutions**:
1. Verify JWT_SECRET is set correctly
2. Check token hasn't expired
3. Verify token format in Authorization header

### CORS Errors

**Error**: `Access to XMLHttpRequest blocked by CORS policy`

**Solutions**:
1. Verify CORS_ORIGIN matches frontend domain
2. Check frontend is using correct protocol (http/https)
3. Verify frontend port matches CORS_ORIGIN

### Rate Limiting Errors

**Error**: `Too many requests from this IP`

**Solutions**:
1. Increase RATE_LIMIT_MAX_REQUESTS
2. Increase RATE_LIMIT_WINDOW_MS
3. Check for legitimate high-traffic patterns

## Best Practices

### 1. Never Commit Secrets
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
```

### 2. Use Secrets Management
- AWS Secrets Manager
- HashiCorp Vault
- Azure Key Vault
- Google Cloud Secret Manager

### 3. Rotate Secrets Regularly
- JWT_SECRET: Every 90 days
- Database passwords: Every 90 days
- API keys: Every 90 days

### 4. Monitor Environment Variables
- Log when environment variables are loaded
- Alert on missing required variables
- Validate variable values at startup

### 5. Document Configuration
- Keep `.env.example` up to date
- Document all variables
- Include examples for each environment

## Additional Resources

- [12 Factor App - Config](https://12factor.net/config)
- [Express.js Environment Variables](https://expressjs.com/en/advanced/best-practice-security.html)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## Support

For questions or issues with environment configuration:

1. Check `ENV_SETUP_GUIDE.md` for detailed information
2. Review `.env.example` for available variables
3. Check application logs for configuration errors
4. Verify all required variables are set

---

**Last Updated**: 2024
**Version**: 1.0
