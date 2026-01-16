# Database Setup Guide

## Overview

The application now logs all search results to PostgreSQL for analytics and debugging. This guide shows you how to set up the database.

---

## Database Schema

The following models are used:

### SearchLog
Stores search parameters and metadata:
- Session ID (tracks users across searches)
- Search parameters (destination, dates, guests)
- Results count
- Response time
- Status (success/error)
- Luxury hotel statistics

### HotelResult
Stores individual hotel results:
- Hotel details (code, name, chain, rating)
- Location data
- Rates (lowest, highest)
- Amenities and images

### Booking
Stores completed bookings (ready for when booking API is enabled)

### ApiLog
Stores all API calls for debugging

---

## Setup Instructions

### 1. Local Development

**Prerequisites:**
- PostgreSQL installed and running
- Database URL in `.env.local`

**Steps:**

```bash
# 1. Make sure PostgreSQL is running
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql

# 2. Create database
createdb hotel_booking

# 3. Set environment variable
echo "DATABASE_URL=postgresql://localhost:5432/hotel_booking" >> .env.local

# 4. Run migrations
npx prisma migrate dev

# 5. Generate Prisma client
npx prisma generate
```

### 2. Production (VPS)

If deploying to your VPS at 154.12.252.80:

```bash
# SSH into VPS
ssh root@154.12.252.80

# Install PostgreSQL (if not already installed)
apt update
apt install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb hotel_booking
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_password';"

# In your project directory
cd /root/hotel-booking

# Set environment variable
echo "DATABASE_URL=postgresql://postgres:your_password@localhost:5432/hotel_booking" >> .env.local

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Restart application
pm2 restart hotel-booking
```

### 3. Vercel (with external database)

**Option A: Use Vercel Postgres**
```bash
# Install Vercel Postgres
vercel postgres create

# Link to your project
vercel link

# Vercel automatically sets DATABASE_URL
```

**Option B: Use external PostgreSQL (recommended for production)**
- Use a managed PostgreSQL service (AWS RDS, DigitalOcean, Supabase)
- Add `DATABASE_URL` to Vercel environment variables
- Redeploy

---

## Verify Database Setup

### Check Tables Exist

```bash
npx prisma studio
```

This opens a web UI at http://localhost:5555 where you can view your database tables.

### Check from Command Line

```bash
npx prisma db pull
```

Should show all tables without errors.

### Test Search Logging

```bash
# 1. Start dev server
npm run dev

# 2. Perform a search in the app
# Visit http://localhost:3000 and search for hotels

# 3. Check database
npx prisma studio

# You should see:
# - SearchLog entries with search parameters
# - HotelResult entries with hotel details
```

---

## View Analytics

Once you have search data in the database:

**Analytics Dashboard:**
```
http://localhost:3000/analytics
```

**API Endpoint:**
```bash
# Last 30 days
curl http://localhost:3000/api/analytics/search-stats

# Last 7 days
curl http://localhost:3000/api/analytics/search-stats?days=7
```

**Sample Response:**
```json
{
  "success": true,
  "period": "Last 30 days",
  "search": {
    "totalSearches": 127,
    "successfulSearches": 125,
    "failedSearches": 2,
    "successRate": 98.43,
    "topDestinations": [
      { "destination": "Paris", "count": 45 },
      { "destination": "New York", "count": 32 },
      { "destination": "Tokyo", "count": 28 }
    ]
  },
  "luxury": {
    "totalHotels": 6350,
    "totalLuxuryHotels": 234,
    "luxuryAppearanceRate": 3.68,
    "averageLuxuryPerSearch": 1.84
  }
}
```

---

## Troubleshooting

### "Can't reach database server"
**Cause:** PostgreSQL is not running
**Fix:**
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check status
brew services list  # macOS
systemctl status postgresql  # Linux
```

### "Database does not exist"
**Cause:** Database not created
**Fix:**
```bash
createdb hotel_booking
```

### "Connection refused"
**Cause:** Wrong database URL
**Fix:** Check your `.env.local`:
```bash
cat .env.local | grep DATABASE_URL
```

Should be:
```
DATABASE_URL=postgresql://localhost:5432/hotel_booking
```

### Migrations fail
**Cause:** Schema changes conflict with existing data
**Fix:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or migrate manually
npx prisma migrate dev
```

---

## Data Retention

### Automatic Cleanup (Recommended)

Add a cron job to clean old search logs:

```bash
# Create cleanup script
cat > scripts/cleanup-old-searches.ts << 'EOF'
import { prisma } from '../src/lib/prisma';

async function cleanup() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const deleted = await prisma.searchLog.deleteMany({
    where: {
      createdAt: { lt: thirtyDaysAgo }
    }
  });

  console.log(\`Deleted \${deleted.count} old search logs\`);
}

cleanup().catch(console.error);
EOF

# Add to crontab (runs daily at 3am)
crontab -e
# Add: 0 3 * * * cd /path/to/project && npx tsx scripts/cleanup-old-searches.ts
```

---

## What Gets Logged

### Every Search Logs:
✅ Session ID (anonymous user tracking)
✅ Search parameters (destination, dates, guests)
✅ All hotel results (enriched with luxury data)
✅ Response time
✅ Luxury hotel count and percentage
✅ Whether results were cached

### NOT Logged:
❌ User IP addresses
❌ Personal information
❌ Payment details
❌ Cookies (except session ID)

---

## Benefits

### Analytics
- Track popular destinations
- Monitor luxury hotel appearance rates
- Analyze search patterns

### Debugging
- Review historical searches that failed
- Check what hotels were returned for specific queries
- Verify luxury enrichment is working

### Performance
- Monitor response times
- Identify slow searches
- Optimize based on data

### Business Intelligence
- Understand user behavior
- Identify trending destinations
- Track luxury hotel demand

---

## Migration Status

Current schema includes:
- ✅ SearchLog model
- ✅ HotelResult model
- ✅ Booking model (ready for booking API)
- ✅ ApiLog model

**Action Required:**
Run `npx prisma migrate dev` to create these tables in your database.

---

## Next Steps

1. **Set up database** (follow instructions above)
2. **Run migrations** (`npx prisma migrate dev`)
3. **Test a search** (visit app and search for hotels)
4. **View analytics** (visit `/analytics`)
5. **Set up cleanup cron** (optional, recommended for production)

---

**Questions?** Check the logs:
```bash
# Development
npm run dev

# Production (VPS)
pm2 logs hotel-booking
```
