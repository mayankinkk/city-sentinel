# 🚀 City Sentinel - Deployment Guide

Complete guide to deploy City Sentinel on your own infrastructure or government servers.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Deployment Options](#deployment-options)
4. [Docker Deployment](#docker-deployment)
5. [Manual Deployment](#manual-deployment)
6. [Database Setup](#database-setup)
7. [Environment Variables](#environment-variables)
8. [Security Hardening](#security-hardening)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### Minimum Hardware Requirements

| Component | Development | Production (Small) | Production (Large) |
|-----------|-------------|-------------------|-------------------|
| CPU | 2 cores | 4 cores | 8+ cores |
| RAM | 4 GB | 8 GB | 16+ GB |
| Storage | 20 GB SSD | 100 GB SSD | 500+ GB SSD |
| Network | 10 Mbps | 100 Mbps | 1 Gbps |

### Software Requirements

- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **PostgreSQL**: v14+ (or Supabase)
- **Docker**: v24.x (optional, for containerized deployment)
- **Nginx**: v1.24+ (for reverse proxy)
- **SSL Certificate**: Required for production

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                        │
│                    (Nginx / AWS ALB)                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Frontend      │ │   Frontend      │ │   Frontend      │
│   Container     │ │   Container     │ │   Container     │
│   (React/Vite)  │ │   (React/Vite)  │ │   (React/Vite)  │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │     Supabase / PostgreSQL │
              │   ┌────────────────────┐ │
              │   │  Auth   │ Database │ │
              │   ├─────────┼──────────┤ │
              │   │ Storage │ Realtime │ │
              │   └─────────┴──────────┘ │
              │      Edge Functions      │
              └──────────────────────────┘
```

---

## 🎯 Deployment Options

### Option 1: Supabase Cloud (Recommended for Quick Start)

**Best for:** Pilots, small cities, rapid deployment

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run migration script (see [Database Setup](#database-setup))
3. Deploy frontend to Vercel/Netlify
4. Configure environment variables

**Pros:** No infrastructure management, automatic backups, built-in auth
**Cons:** Data on third-party servers, monthly costs

### Option 2: Self-Hosted Supabase (Government Preferred)

**Best for:** Government compliance, data sovereignty

1. Deploy Supabase using Docker on government servers
2. Full control over data location
3. Custom security configurations

**Pros:** Complete data ownership, compliance-ready
**Cons:** Requires DevOps expertise, maintenance overhead

### Option 3: Bare PostgreSQL + Custom Backend

**Best for:** Integration with existing government systems

1. Deploy PostgreSQL on existing infrastructure
2. Implement custom authentication
3. Handle file storage separately

---

## 🐳 Docker Deployment

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/city-sentinel.git
cd city-sentinel

# Copy environment template
cp .env.example .env.production

# Edit environment variables
nano .env.production

# Build and run
docker-compose -f docker-compose.prod.yml up -d
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_PUBLISHABLE_KEY=${SUPABASE_ANON_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Only if self-hosting Supabase
  supabase-db:
    image: supabase/postgres:15.1.0.117
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - supabase-db-data:/var/lib/postgresql/data
      - ./public/city-sentinel-full-migration.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  supabase-auth:
    image: supabase/gotrue:v2.99.0
    depends_on:
      - supabase-db
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@supabase-db:5432/postgres
      GOTRUE_SITE_URL: ${SITE_URL}
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_MAILER_AUTOCONFIRM: true
    restart: unless-stopped

  supabase-storage:
    image: supabase/storage-api:v0.40.4
    depends_on:
      - supabase-db
    environment:
      ANON_KEY: ${SUPABASE_ANON_KEY}
      SERVICE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      DATABASE_URL: postgres://postgres:${POSTGRES_PASSWORD}@supabase-db:5432/postgres
      FILE_SIZE_LIMIT: 52428800
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
    volumes:
      - supabase-storage-data:/var/lib/storage
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
    restart: unless-stopped

volumes:
  supabase-db-data:
  supabase-storage-data:
```

---

## 🔨 Manual Deployment

### Step 1: Build Frontend

```bash
# Install dependencies
npm install --legacy-peer-deps

# Build for production
npm run build

# Output is in ./dist folder
```

### Step 2: Deploy to Web Server

```bash
# Copy build files to server
scp -r dist/* user@server:/var/www/city-sentinel/

# Or use rsync for incremental updates
rsync -avz --delete dist/ user@server:/var/www/city-sentinel/
```

### Step 3: Configure Nginx

```nginx
# /etc/nginx/sites-available/city-sentinel
server {
    listen 80;
    server_name city-sentinel.yourgovt.gov.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name city-sentinel.yourgovt.gov.in;

    ssl_certificate /etc/ssl/certs/city-sentinel.crt;
    ssl_certificate_key /etc/ssl/private/city-sentinel.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    root /var/www/city-sentinel;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;" always;

    # React Router support
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass https://your-supabase-url.supabase.co/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 🗄️ Database Setup

### Using Supabase Cloud

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `public/city-sentinel-full-migration.sql`
3. Run the entire script

### Using Self-Hosted PostgreSQL

```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d city_sentinel

# Run migration
\i /path/to/city-sentinel-full-migration.sql
```

### Create First Super Admin

```sql
-- After a user signs up, make them super admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_UUID_HERE', 'super_admin');
```

---

## 🔐 Environment Variables

Create `.env.production`:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_SUPABASE_PROJECT_ID=your-project-id

# For self-hosted Supabase
POSTGRES_PASSWORD=your-secure-password-min-32-chars
JWT_SECRET=your-jwt-secret-min-32-chars
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...

# Application Settings
SITE_URL=https://city-sentinel.yourgovt.gov.in
NODE_ENV=production

# Email Configuration (for notifications)
RESEND_API_KEY=re_xxxxx

# Optional: Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX
```

---

## 🛡️ Security Hardening

### 1. SSL/TLS Configuration

```bash
# Generate SSL certificate (Let's Encrypt)
sudo certbot --nginx -d city-sentinel.yourgovt.gov.in
```

### 2. Firewall Rules

```bash
# UFW configuration
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5432/tcp  # Block direct DB access
sudo ufw enable
```

### 3. Database Security

```sql
-- Revoke public schema access
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Create read-only user for backups
CREATE USER backup_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
```

### 4. Security Checklist

- [ ] SSL certificate installed and valid
- [ ] Database not accessible from public internet
- [ ] Strong passwords (min 12 chars) enforced
- [ ] Rate limiting enabled on auth endpoints
- [ ] CORS configured for specific domains only
- [ ] All secrets stored in environment variables
- [ ] Regular security updates scheduled
- [ ] Backup and disaster recovery tested

---

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Create health check script
#!/bin/bash
# /opt/scripts/health-check.sh

FRONTEND_URL="https://city-sentinel.yourgovt.gov.in"
DB_HOST="localhost"

# Check frontend
if curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL | grep -q "200"; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is down"
    # Send alert
fi

# Check database
if pg_isready -h $DB_HOST -p 5432; then
    echo "✅ Database is healthy"
else
    echo "❌ Database is down"
    # Send alert
fi
```

### Backup Strategy

```bash
# Daily database backup
#!/bin/bash
# /opt/scripts/backup.sh

BACKUP_DIR="/var/backups/city-sentinel"
DATE=$(date +%Y-%m-%d)

# Create backup
pg_dump -h localhost -U postgres city_sentinel > $BACKUP_DIR/db-$DATE.sql

# Compress
gzip $BACKUP_DIR/db-$DATE.sql

# Keep last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to offsite storage (optional)
# aws s3 cp $BACKUP_DIR/db-$DATE.sql.gz s3://your-bucket/backups/
```

### Cron Jobs

```bash
# /etc/cron.d/city-sentinel
# Daily backup at 2 AM
0 2 * * * root /opt/scripts/backup.sh

# Health check every 5 minutes
*/5 * * * * root /opt/scripts/health-check.sh

# Weekly security updates
0 3 * * 0 root apt-get update && apt-get upgrade -y
```

---

## 🔧 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | Frontend container down | `docker-compose restart frontend` |
| Auth not working | Wrong Supabase URL | Check `.env` variables |
| Images not loading | Storage bucket permissions | Check RLS on storage |
| Slow queries | Missing indexes | Run `ANALYZE` on tables |
| Connection refused | Firewall blocking | Check `ufw status` |

### Logs Location

```bash
# Application logs
docker-compose logs -f frontend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Support Contact

For deployment assistance:
- **Email**: support@city-sentinel.io
- **Documentation**: https://docs.city-sentinel.io
- **GitHub Issues**: https://github.com/your-org/city-sentinel/issues

---

## 📄 License

City Sentinel is open-source software licensed under the MIT License.

---

**Developed by Mayank Sharma** | B.Tech CSE
