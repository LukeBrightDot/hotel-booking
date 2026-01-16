# Deployment Guide - Complete Checklist

**Project:** Hotel Booking Application (Bellhopping Replica)
**Target Server:** VPS at 154.12.252.80
**Current Port:** 3001 (3000 is occupied)
**Status:** Ready for production deployment with database

---

## 🎯 Deployment Overview

This guide covers deploying the complete application including:
- Next.js application with all features
- PostgreSQL database setup
- Search result logging
- Luxury hotel intelligence system
- Analytics dashboard
- Voice assistant

---

## 📋 Pre-Deployment Checklist

### Local Preparation

- [ ] **Code is committed to Git**
  ```bash
  git add .
  git commit -m "feat: complete hotel booking app with analytics"
  git push origin main
  ```

- [ ] **All environment variables documented**
  - Sabre API credentials
  - Database URL
  - OpenAI API key (for voice assistant)
  - Port configuration

- [ ] **Build succeeds locally**
  ```bash
  npm run build
  # Should complete without errors
  ```

- [ ] **Database schema is ready**
  - Prisma schema is finalized
  - Migrations are tested locally

---

## 🚀 Deployment Steps

### Phase 1: Server Preparation

#### 1.1 Install PostgreSQL

```bash
# SSH into VPS
ssh root@154.12.252.80

# Update system
apt update && apt upgrade -y

# Install PostgreSQL
apt install postgresql postgresql-contrib -y

# Check PostgreSQL is running
systemctl status postgresql
# Should show "active (running)"

# If not running:
systemctl start postgresql
systemctl enable postgresql
```

#### 1.2 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE hotel_booking;
CREATE USER hotel_booking_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE hotel_booking TO hotel_booking_user;
\q

# Test connection
psql -U hotel_booking_user -d hotel_booking -h localhost
# Enter password when prompted
# Should connect successfully
\q
```

#### 1.3 Configure PostgreSQL for Remote Access (if needed)

```bash
# Edit PostgreSQL config
nano /etc/postgresql/*/main/postgresql.conf

# Change:
# listen_addresses = 'localhost'
# To:
listen_addresses = 'localhost'  # Keep localhost-only for security

# Edit pg_hba.conf
nano /etc/postgresql/*/main/pg_hba.conf

# Add this line:
local   hotel_booking   hotel_booking_user   md5

# Restart PostgreSQL
systemctl restart postgresql
```

---

### Phase 2: Application Deployment

#### 2.1 Update Application Code

```bash
# Navigate to project directory
cd /root/hotel-booking

# Pull latest code
git pull origin main

# Install dependencies (including new ones)
npm install
```

#### 2.2 Configure Environment Variables

```bash
# Edit .env.local
nano /root/hotel-booking/.env.local

# Add/update ALL environment variables:
```

```bash
# ===== SERVER CONFIGURATION =====
PORT=3001
NODE_ENV=production

# ===== DATABASE =====
DATABASE_URL=postgresql://hotel_booking_user:your_secure_password_here@localhost:5432/hotel_booking

# ===== SABRE API CREDENTIALS =====
SABRE_CLIENT_ID=VD35-Coastline52JL
SABRE_CLIENT_SECRET=your_client_secret_here
SABRE_PCC=52JL
SABRE_USERNAME=250463
SABRE_DOMAIN=AA

# ===== OPENAI API (Voice Assistant) =====
OPENAI_API_KEY=your_openai_api_key_here

# ===== OPTIONAL: LOGGING =====
LOG_LEVEL=info
```

**Security Note:** Save these credentials securely! Back up to a password manager.

#### 2.3 Generate Prisma Client

```bash
# Generate Prisma client for the database
npx prisma generate
```

#### 2.4 Run Database Migrations

```bash
# Run migrations to create all tables
npx prisma migrate deploy

# Expected output:
# ✔ Migrations applied:
#   - SearchLog table created
#   - HotelResult table created
#   - Booking table created
#   - ApiLog table created
```

#### 2.5 Verify Database Setup

```bash
# Check tables were created
psql -U hotel_booking_user -d hotel_booking -c "\dt"

# Should show:
#  Schema |    Name      | Type  |        Owner
# --------+--------------+-------+---------------------
#  public | SearchLog    | table | hotel_booking_user
#  public | HotelResult  | table | hotel_booking_user
#  public | Booking      | table | hotel_booking_user
#  public | ApiLog       | table | hotel_booking_user
```

#### 2.6 Build Application

```bash
# Build Next.js for production
npm run build

# Should complete successfully
# Check for any TypeScript errors and fix them
```

---

### Phase 3: Process Management

#### 3.1 Stop Old Process

```bash
# Stop current PM2 process
pm2 stop hotel-booking

# Or stop all
pm2 stop all

# Check status
pm2 list
```

#### 3.2 Start New Process

```bash
# Start with PM2
pm2 start npm --name "hotel-booking" -- start

# Or if you have an ecosystem file:
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Enable PM2 on system startup
pm2 startup
# Follow the command it outputs
```

#### 3.3 Verify Application is Running

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs hotel-booking --lines 50

# Test HTTP endpoint
curl http://localhost:3001/api/auth/test

# Should return:
# {"status":"success","version":"v2-epr"}
```

---

### Phase 4: Nginx Configuration (if using)

#### 4.1 Create Nginx Config (if not already exists)

```bash
# Create nginx config
nano /etc/nginx/sites-available/hotel-booking

# Add configuration:
```

```nginx
server {
    listen 80;
    server_name 154.12.252.80 your-domain.com;

    # Increase body size for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts for long-running requests
        proxy_read_timeout 90;
        proxy_connect_timeout 90;
        proxy_send_timeout 90;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/hotel-booking /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx
```

#### 4.2 SSL Certificate (Optional but Recommended)

```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get SSL certificate
certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
# Test renewal:
certbot renew --dry-run
```

---

### Phase 5: Verification & Testing

#### 5.1 Test All Endpoints

```bash
# 1. Test authentication
curl http://154.12.252.80/api/auth/test

# 2. Test search (replace with real location)
curl -X POST http://154.12.252.80/api/search/hotels \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"name": "Paris", "city": "Paris", "country": "France"},
    "checkIn": "2026-03-01",
    "checkOut": "2026-03-03",
    "rooms": 1,
    "adults": 2,
    "children": 0
  }'

# 3. Test analytics (after some searches)
curl http://154.12.252.80/api/analytics/search-stats?days=7
```

#### 5.2 Test Web Interface

```bash
# In browser, test these URLs:
http://154.12.252.80/                    # Home page
http://154.12.252.80/assistant           # Voice assistant
http://154.12.252.80/analytics           # Analytics dashboard
```

#### 5.3 Verify Database Logging

```bash
# Check database has data
psql -U hotel_booking_user -d hotel_booking -c "SELECT COUNT(*) FROM \"SearchLog\";"

# Should return > 0 after performing searches

# Check recent searches
psql -U hotel_booking_user -d hotel_booking -c "SELECT destination, \"resultsCount\", \"createdAt\" FROM \"SearchLog\" ORDER BY \"createdAt\" DESC LIMIT 5;"
```

---

### Phase 6: Post-Deployment Setup

#### 6.1 Run Luxury Hotel Discovery

```bash
# Navigate to project
cd /root/hotel-booking

# Run discovery to populate luxury hotel database
npm run discover-luxury -- --cities="Paris,New York,Tokyo,Dubai,London"

# Review results and update mappings
npm run update-luxury-mappings -- --merge

# Commit changes
git add src/lib/data/luxury-mapping.ts
git commit -m "chore: populate luxury hotel database"
git push origin main
```

#### 6.2 Set Up Monthly Re-Verification

```bash
# Create cron job for monthly luxury hotel re-verification
crontab -e

# Add this line (runs 1st of month at 3am):
0 3 1 * * cd /root/hotel-booking && npm run reverify-luxury && git add . && git commit -m "chore: reverify luxury hotels" && git push

# Save and exit
```

#### 6.3 Set Up Database Cleanup

```bash
# Create cleanup script
cat > /root/hotel-booking/scripts/cleanup-old-searches.ts << 'EOF'
#!/usr/bin/env tsx
import { prisma } from '../src/lib/prisma';

async function cleanup() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deleted = await prisma.searchLog.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo }
    }
  });

  console.log(`Deleted ${deleted.count} old search logs`);
  await prisma.$disconnect();
}

cleanup().catch(console.error);
EOF

# Add to crontab (runs daily at 4am)
crontab -e

# Add this line:
0 4 * * * cd /root/hotel-booking && npx tsx scripts/cleanup-old-searches.ts >> /var/log/cleanup-searches.log 2>&1

# Save and exit
```

#### 6.4 Set Up Monitoring

```bash
# Install monitoring script
cat > /root/monitor-hotel-booking.sh << 'EOF'
#!/bin/bash
# Check if app is running
if ! pm2 describe hotel-booking > /dev/null 2>&1; then
    echo "$(date): App not running, restarting..." >> /var/log/hotel-booking-monitor.log
    cd /root/hotel-booking && pm2 start npm --name "hotel-booking" -- start
fi

# Check if database is running
if ! systemctl is-active --quiet postgresql; then
    echo "$(date): PostgreSQL not running, restarting..." >> /var/log/hotel-booking-monitor.log
    systemctl start postgresql
fi
EOF

chmod +x /root/monitor-hotel-booking.sh

# Add to crontab (runs every 5 minutes)
crontab -e

# Add this line:
*/5 * * * * /root/monitor-hotel-booking.sh

# Save and exit
```

---

## 🔒 Security Checklist

### Database Security

- [ ] **Strong password set** for database user
- [ ] **PostgreSQL listening on localhost only** (not exposed to internet)
- [ ] **Database backups configured**
  ```bash
  # Create backup script
  cat > /root/backup-db.sh << 'EOF'
  #!/bin/bash
  BACKUP_DIR="/root/backups/postgres"
  mkdir -p $BACKUP_DIR
  FILENAME="hotel_booking_$(date +%Y%m%d_%H%M%S).sql"
  pg_dump -U hotel_booking_user hotel_booking > $BACKUP_DIR/$FILENAME
  # Keep only last 7 days
  find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
  EOF

  chmod +x /root/backup-db.sh

  # Add to crontab (daily at 2am)
  crontab -e
  # Add: 0 2 * * * /root/backup-db.sh
  ```

### Application Security

- [ ] **Environment variables not in Git**
  ```bash
  # Verify .env.local is in .gitignore
  grep ".env.local" .gitignore
  ```

- [ ] **API keys are secure and not default**
- [ ] **HTTPS enabled** (if using domain)
- [ ] **Firewall configured**
  ```bash
  # Basic UFW setup
  ufw allow 22/tcp      # SSH
  ufw allow 80/tcp      # HTTP
  ufw allow 443/tcp     # HTTPS
  ufw enable
  ufw status
  ```

---

## 📊 Monitoring & Maintenance

### Daily Checks

```bash
# Check app status
pm2 status

# Check logs for errors
pm2 logs hotel-booking --lines 100 | grep -i error

# Check database size
psql -U hotel_booking_user -d hotel_booking -c "SELECT pg_size_pretty(pg_database_size('hotel_booking'));"

# Check disk space
df -h

# Check memory usage
free -h
```

### Weekly Checks

```bash
# Review analytics
curl http://localhost:3001/api/analytics/search-stats?days=7

# Check for failed searches
psql -U hotel_booking_user -d hotel_booking -c "SELECT COUNT(*) FROM \"SearchLog\" WHERE status='error';"

# Review PM2 status
pm2 monit
```

### Monthly Tasks

```bash
# Update dependencies (test locally first!)
npm outdated
npm update

# Check for security vulnerabilities
npm audit

# Review database backups
ls -lh /root/backups/postgres/

# Review luxury hotel mappings
npm run reverify-luxury -- --dry-run
```

---

## 🐛 Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs hotel-booking --lines 100

# Common issues:
# 1. Database connection
psql -U hotel_booking_user -d hotel_booking -c "SELECT 1;"

# 2. Port already in use
lsof -i :3001

# 3. Missing environment variables
cat /root/hotel-booking/.env.local

# 4. Build errors
cd /root/hotel-booking && npm run build
```

### Database Connection Errors

```bash
# Check PostgreSQL is running
systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep hotel_booking

# Check user permissions
sudo -u postgres psql -c "SELECT * FROM pg_database WHERE datname='hotel_booking';"

# Test connection
psql -U hotel_booking_user -d hotel_booking -h localhost
```

### Analytics Dashboard Empty

```bash
# Check if searches are being logged
psql -U hotel_booking_user -d hotel_booking -c "SELECT COUNT(*) FROM \"SearchLog\";"

# If 0, perform a test search:
curl -X POST http://localhost:3001/api/search/hotels \
  -H "Content-Type: application/json" \
  -d '{"location":{"name":"Paris","city":"Paris","country":"France"},"checkIn":"2026-03-01","checkOut":"2026-03-03","rooms":1,"adults":2,"children":0}'

# Check again
psql -U hotel_booking_user -d hotel_booking -c "SELECT COUNT(*) FROM \"SearchLog\";"
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart app
pm2 restart hotel-booking

# Check PM2 memory limit (optional)
pm2 start ecosystem.config.js --max-memory-restart 1G
```

---

## 📦 Rollback Procedure

If deployment fails:

```bash
# 1. Stop current process
pm2 stop hotel-booking

# 2. Checkout previous version
cd /root/hotel-booking
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# 3. Rebuild
npm install
npm run build

# 4. Restart
pm2 restart hotel-booking

# 5. Verify
curl http://localhost:3001/api/auth/test
```

---

## 🎯 Success Criteria

Deployment is successful when:

- ✅ Application accessible at http://154.12.252.80:3001
- ✅ Authentication endpoint returns success
- ✅ Search returns hotel results with luxury badges
- ✅ Voice assistant loads and functions
- ✅ Analytics dashboard shows data
- ✅ Database has SearchLog entries
- ✅ No errors in PM2 logs
- ✅ PostgreSQL running and accessible
- ✅ All cron jobs configured
- ✅ Monitoring scripts active

---

## 📝 Post-Deployment Checklist

- [ ] **Test all features**
  - [ ] Hotel search
  - [ ] Voice assistant
  - [ ] Analytics dashboard
  - [ ] Luxury badges appear on hotels

- [ ] **Verify database logging**
  - [ ] Searches create SearchLog entries
  - [ ] HotelResult entries created
  - [ ] Analytics API returns data

- [ ] **Verify luxury hotel system**
  - [ ] Run discovery script
  - [ ] Update mappings
  - [ ] Luxury badges appear on search results

- [ ] **Set up automated tasks**
  - [ ] Monthly luxury re-verification cron
  - [ ] Daily database cleanup cron
  - [ ] Daily database backup cron
  - [ ] Monitoring script cron

- [ ] **Document for client**
  - [ ] Server IP and port
  - [ ] Admin credentials
  - [ ] Analytics URL
  - [ ] How to view logs

- [ ] **Share access**
  - [ ] Analytics dashboard URL
  - [ ] Any admin interfaces

---

## 🔗 Important URLs

After deployment:

| Service | URL |
|---------|-----|
| **Application** | http://154.12.252.80:3001 |
| **Voice Assistant** | http://154.12.252.80:3001/assistant |
| **Analytics** | http://154.12.252.80:3001/analytics |
| **API Test** | http://154.12.252.80:3001/api/auth/test |
| **Search API** | http://154.12.252.80:3001/api/search/hotels |
| **Analytics API** | http://154.12.252.80:3001/api/analytics/search-stats |

---

## 📞 Support

**Key Files:**
- Deployment guide: `/root/hotel-booking/DEPLOYMENT_GUIDE.md` (this file)
- Database setup: `/root/hotel-booking/DATABASE_SETUP.md`
- Luxury system: `/root/hotel-booking/LUXURY_OPERATIONS_GUIDE.md`
- Project context: `/root/hotel-booking/CLAUDE.md`

**Logs:**
```bash
# Application logs
pm2 logs hotel-booking

# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-*-main.log

# Nginx logs (if using)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

**Deployment Guide Version:** 1.0.0
**Last Updated:** 2026-01-16
**Next Review:** Before deployment
