# Environment Configuration Guide

This guide explains how to set up and configure environment variables for the Porky's Meat Market backend API.

## Overview

The backend application uses environment variables to configure different aspects of the application for different environments (development, staging, production). This allows the same codebase to run in different environments with different configurations.

## Files

- `.env.example` - Template with all available environment variables and descriptions
- `.env` - Development environment configuration (created from .env.example)
- `.env.production` - Production environment configuration template

## Quick Start

### 1. Development Setup

```bash
# Copy the example file to create your development .env
cp backend/.env.example backend/.env

# The .env file is already configured with development defaults
# You can now start the development server
npm run dev
```

### 2. Production Setup

```bash
# Copy the production template
cp backend/.env.production backend/.env.production

# Edit with your production values
nano backend/.env.production

# When deploying, ensure the production .env file is available
# (typically through environment variables or secrets management)
```

## Environment Variables Reference

### Server Configuration

#### NODE_ENV
- **Type**: String
- **Values**: `development`, `staging`, `production`
- **Default**: `development`
- **Description**: Controls application behavior and logging level
- **Development**: Enables debug logging, detailed error messages, hot reload
- **Production**: Optimized for performance, minimal logging, error tracking

#### PORT
- **Type**: Number
- **Default**: `3000`
- **Description**: Server port number
- **Development**: `3000` (local development)
- **Production**: `3000` (behind reverse proxy like nginx)

#### HOST
- **Type**: String
- **Default**: `localhost`
- **Description**: Server hostname/IP to bind to
- **Development**: `localhost` (local only)
- **Production**: `0.0.0.0` (all interfaces)

### Database Configuration

#### DB_HOST
- **Type**: String
- **Default**: `localhost`
- **Description**: PostgreSQL server hostname or IP
- **Development**: `localhost`
- **Production**: Your production database host

#### DB_PORT
- **Type**: Number
- **Default**: `5432`
- **Description**: PostgreSQL server port
- **Note**: Standard PostgreSQL port is 5432

#### DB_NAME
- **Type**: String
- **Default**: `porky_market`
- **Description**: Database name
- **Development**: `porky_market`
- **Production**: `porky_market_prod` (separate database)

#### DB_USER
- **Type**: String
- **Default**: `postgres`
- **Description**: PostgreSQL user account
- **Development**: `postgres` (superuser, for convenience)
- **Production**: `porky_app_user` (dedicated user with minimal permissions)

#### DB_PASSWORD
- **Type**: String
- **Default**: `password`
- **Description**: PostgreSQL user password
- **Security**: Use strong passwords in production (min 16 characters)
- **Security**: Never use default passwords in production

#### DATABASE_URL (Alternative)
- **Type**: String
- **Format**: `postgresql://user:password@host:port/database`
- **Description**: Full connection string (takes precedence over individual DB_* variables)
- **Example**: `postgresql://postgres:password@localhost:5432/porky_market`

### JWT Authentication

#### JWT_SECRET
- **Type**: String
- **Default**: `your_jwt_secret_key_here_change_in_production`
- **Description**: Secret key for signing JWT tokens
- **Security**: Must be a strong random string (min 32 characters)
- **Security**: Generate with: `openssl rand -base64 32`
- **Security**: Change in production - never use default!
- **Security**: If compromised, all existing tokens become invalid

**Generating a secure JWT_SECRET:**
```bash
# Generate a random 32-byte base64-encoded string
openssl rand -base64 32

# Example output:
# aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890abcdefghijklmnop
```

#### JWT_EXPIRY
- **Type**: String
- **Default**: `7d`
- **Description**: Token expiration time
- **Format**: `<number><unit>` where unit is: `s` (seconds), `m` (minutes), `h` (hours), `d` (days), `w` (weeks), `y` (years)
- **Examples**:
  - `7d` - 7 days (typical for web apps)
  - `24h` - 24 hours (more secure)
  - `1h` - 1 hour (very secure, requires frequent refresh)

### CORS Configuration

#### CORS_ORIGIN
- **Type**: String
- **Default**: `http://localhost:8000`
- **Description**: Allowed frontend origin(s) for API requests
- **Development**: `http://localhost:8000`
- **Production**: `https://porkymeatmarket.com`
- **Multiple Origins**: Use comma-separated list (no spaces)
  - Example: `https://example.com,https://www.example.com`
- **Security**: Restrict to known frontend domains in production

### Rate Limiting

#### RATE_LIMIT_WINDOW_MS
- **Type**: Number
- **Default**: `900000` (15 minutes)
- **Description**: Time window for rate limiting in milliseconds
- **Examples**:
  - `60000` - 1 minute (strict)
  - `300000` - 5 minutes
  - `900000` - 15 minutes (default)
  - `3600000` - 1 hour

#### RATE_LIMIT_MAX_REQUESTS
- **Type**: Number
- **Default**: `100`
- **Description**: Maximum requests per window per IP
- **Examples**:
  - `10` - Strict (for sensitive endpoints like login)
  - `100` - Default (reasonable for most APIs)
  - `1000` - Generous (for high-traffic endpoints)

### API Configuration

#### API_PREFIX
- **Type**: String
- **Default**: `/api`
- **Description**: Base path for all API endpoints
- **Examples**:
  - `/api` - Standard REST API prefix
  - `/api/v1` - Versioned API (for future compatibility)

### Email Configuration (Optional)

#### SMTP_HOST
- **Type**: String
- **Default**: `smtp.gmail.com`
- **Description**: SMTP server hostname
- **Examples**:
  - `smtp.gmail.com` - Gmail SMTP server
  - `smtp.sendgrid.net` - SendGrid SMTP server
  - `mail.example.com` - Custom mail server

#### SMTP_PORT
- **Type**: Number
- **Default**: `587`
- **Description**: SMTP server port
- **Examples**:
  - `25` - Unencrypted (not recommended)
  - `587` - TLS (recommended)
  - `465` - SSL

#### SMTP_USER
- **Type**: String
- **Default**: `your_email@gmail.com`
- **Description**: SMTP authentication username
- **Examples**:
  - `your_email@gmail.com` - Gmail account
  - `api_user@sendgrid.net` - SendGrid API user

#### SMTP_PASSWORD
- **Type**: String
- **Default**: `your_app_password`
- **Description**: SMTP authentication password
- **Security**: Use app-specific passwords, not account passwords
- **Security**: For Gmail: Use 16-character app password
- **Note**: Leave empty if email notifications are not required

## Environment-Specific Configurations

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

**Characteristics:**
- Uses localhost for all services
- Weak passwords (for convenience)
- Debug logging enabled
- Longer JWT expiry for testing
- Permissive CORS settings

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

**Characteristics:**
- Production-like settings
- Strong passwords
- Realistic data
- Performance monitoring
- Separate database

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

**Characteristics:**
- Strong, unique passwords (min 16 characters)
- Secure, random JWT_SECRET
- Restricted CORS_ORIGIN
- Separate database
- Monitoring and alerting enabled
- HTTPS only (via reverse proxy)
- Regular secret rotation

## Security Best Practices

### 1. Secret Management

**Development:**
- Use weak secrets for convenience
- Store in `.env` file (not committed)

**Production:**
- Use strong, random secrets
- Store in secrets management system:
  - AWS Secrets Manager
  - HashiCorp Vault
  - Azure Key Vault
  - Google Cloud Secret Manager
- Never commit secrets to version control
- Rotate secrets regularly (every 90 days)

### 2. Database Security

**Development:**
- Use default credentials
- Local database only

**Production:**
- Use strong passwords (min 16 characters)
- Dedicated database user with minimal permissions
- Encrypted connections (SSL/TLS)
- Regular backups
- Automated recovery procedures
- Consider managed database services (AWS RDS, Azure Database)

### 3. JWT Security

**Development:**
- Use simple secrets
- Longer expiry for testing

**Production:**
- Generate with: `openssl rand -base64 32`
- Shorter expiry (24 hours recommended)
- Implement token refresh mechanism
- Rotate secrets periodically
- Monitor token usage

### 4. CORS Security

**Development:**
- Allow localhost

**Production:**
- Restrict to known frontend domains
- Use HTTPS URLs only
- Avoid wildcard (`*`) in production
- Regularly review allowed origins

### 5. Rate Limiting

**Development:**
- Permissive limits for testing

**Production:**
- Strict limits to prevent abuse
- Different limits for different endpoints
- Monitor for suspicious patterns
- Implement DDoS protection

## Deployment Checklist

Before deploying to production:

- [ ] Update all environment variables with production values
- [ ] Generate new JWT_SECRET with: `openssl rand -base64 32`
- [ ] Use strong database password (min 16 characters)
- [ ] Set CORS_ORIGIN to production frontend domain(s)
- [ ] Enable HTTPS/TLS on reverse proxy (nginx, Apache, etc.)
- [ ] Set up database backups and recovery procedures
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation (ELK, Splunk, CloudWatch, etc.)
- [ ] Enable rate limiting and DDoS protection
- [ ] Configure firewall rules and security groups
- [ ] Set up SSL/TLS certificates (Let's Encrypt, AWS ACM, etc.)
- [ ] Test all API endpoints with production configuration
- [ ] Verify database connectivity and performance
- [ ] Set up automated backups
- [ ] Configure secrets management system
- [ ] Document deployment procedures
- [ ] Plan rollback procedures
- [ ] Set up monitoring dashboards
- [ ] Configure alerting for errors and performance issues
- [ ] Test disaster recovery procedures

## Troubleshooting

### Database Connection Issues

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions**:
1. Verify PostgreSQL is running: `psql --version`
2. Check DB_HOST and DB_PORT are correct
3. Verify database exists: `psql -l`
4. Check database user and password

### JWT Token Issues

**Problem**: `JsonWebTokenError: invalid token`

**Solutions**:
1. Verify JWT_SECRET is set correctly
2. Check token hasn't expired
3. Verify token format in Authorization header
4. Check CORS_ORIGIN allows frontend domain

### CORS Issues

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solutions**:
1. Verify CORS_ORIGIN matches frontend domain
2. Check frontend is using correct protocol (http/https)
3. Verify frontend port matches CORS_ORIGIN
4. Check for typos in CORS_ORIGIN

### Rate Limiting Issues

**Problem**: `Too many requests from this IP`

**Solutions**:
1. Increase RATE_LIMIT_MAX_REQUESTS
2. Increase RATE_LIMIT_WINDOW_MS
3. Check for legitimate high-traffic patterns
4. Implement IP whitelisting if needed

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [JWT Introduction](https://jwt.io/introduction)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Environment Variables Best Practices](https://12factor.net/config)
