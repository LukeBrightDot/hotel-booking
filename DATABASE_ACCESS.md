# Database Access Guide

Quick reference for accessing the centralized PostgreSQL database on the VPS.

---

## 🔐 Credentials

**Database:** `hotel_booking`
**Host:** `154.12.252.80`
**Port:** `6432` (PgBouncer)
**User:** `hotel_booking_user`
**Password:** `CXmJLlDK4SxBKarY/lc5AWTRHbS3jKTr`

**Full Connection String:**
```
postgresql://hotel_booking_user:CXmJLlDK4SxBKarY%2Flc5AWTRHbS3jKTr@154.12.252.80:6432/hotel_booking
```

**Note:** Password contains `/` which must be URL-encoded as `%2F` in connection strings.

---

## 🚀 Quick Access Commands

### Open Prisma Studio (Visual Database Browser)

```bash
npm run db:studio
```

Or manually:
```bash
npx prisma studio
```

**Opens:** http://localhost:5555

### View Recent Searches

```bash
npm run db:recent-searches
```

### Count Total Searches

```bash
npm run db:count
```

### Export Search Data (CSV)

```bash
npm run db:export
```

---

## 📊 Manual Database Queries

### Using Prisma CLI

```bash
# Count searches
DATABASE_URL="postgresql://hotel_booking_user:CXmJLlDK4SxBKarY%2Flc5AWTRHbS3jKTr@154.12.252.80:6432/hotel_booking" \
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"SearchLog\";"

# View recent searches
DATABASE_URL="postgresql://hotel_booking_user:CXmJLlDK4SxBKarY%2Flc5AWTRHbS3jKTr@154.12.252.80:6432/hotel_booking" \
npx prisma db execute --stdin <<< "SELECT destination, \"checkIn\", \"resultsCount\", \"createdAt\" FROM \"SearchLog\" ORDER BY \"createdAt\" DESC LIMIT 10;"
```

### Using psql (if installed)

```bash
# Interactive session
PGPASSWORD='CXmJLlDK4SxBKarY/lc5AWTRHbS3jKTr' psql -h 154.12.252.80 -p 6432 -U hotel_booking_user -d hotel_booking

# Single query
PGPASSWORD='CXmJLlDK4SxBKarY/lc5AWTRHbS3jKTr' psql -h 154.12.252.80 -p 6432 -U hotel_booking_user -d hotel_booking -c "SELECT COUNT(*) FROM \"SearchLog\";"
```

---

## 📁 Database Schema

### Tables

| Table | Purpose | Records |
|-------|---------|---------|
| `SearchLog` | Search history with session tracking | Primary data |
| `HotelResult` | Individual hotel results (linked to searches) | Detailed results |
| `Booking` | Booking records (future use) | When booking API enabled |
| `ApiLog` | API call logging | Debugging |

### Key Relationships

```
SearchLog (1) ──── (Many) HotelResult
  └─ One search has many hotel results
  └─ Cascade delete (deleting search deletes results)
```

---

## 🌐 Admin Panel Access (Future)

### Local Admin Panel

Once implemented, access at:
```
http://localhost:3000/admin
```

### Production Admin Panel

Once deployed, access at:
```
http://154.12.252.80:3001/admin
```

**Features to implement:**
- 📊 Search analytics dashboard
- 🏨 Hotel result browser
- 📈 Luxury hotel statistics
- 🔍 Search query explorer
- 📅 Date range filters
- 📥 Data export (CSV, JSON)

---

## 🛠️ Common Operations

### View All Searches from Last 24 Hours

```sql
SELECT
  destination,
  "checkIn",
  "checkOut",
  "resultsCount",
  "createdAt"
FROM "SearchLog"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC;
```

### Find Most Popular Destinations

```sql
SELECT
  destination,
  COUNT(*) as search_count
FROM "SearchLog"
WHERE status = 'success'
GROUP BY destination
ORDER BY search_count DESC
LIMIT 10;
```

### Get Search Details with Hotel Count

```sql
SELECT
  s.id,
  s.destination,
  s."checkIn",
  s."checkOut",
  s."resultsCount",
  COUNT(h.id) as hotel_results
FROM "SearchLog" s
LEFT JOIN "HotelResult" h ON h."searchLogId" = s.id
GROUP BY s.id
ORDER BY s."createdAt" DESC
LIMIT 10;
```

### View Luxury Hotel Searches

```sql
SELECT
  destination,
  "searchParams"->>'luxuryCount' as luxury_count,
  "searchParams"->>'luxuryPercentage' as luxury_percentage,
  "resultsCount",
  "createdAt"
FROM "SearchLog"
WHERE ("searchParams"->>'luxuryCount')::int > 0
ORDER BY "createdAt" DESC;
```

---

## 🔒 Security Notes

**Credentials Storage:**
- ✅ Stored in `.env.local` (gitignored)
- ✅ Documented in `CENTRALIZED_DB_COMPLETE.md`
- ✅ Documented in this file (`DATABASE_ACCESS.md`)
- ⚠️ Never commit credentials to git

**Admin Panel Security (when implemented):**
- Use authentication (session-based or JWT)
- Restrict to authorized users only
- Use read-only database user for viewing
- Separate write permissions for admin operations

---

## 📝 For New Claude Sessions

When starting a new conversation and need database access:

1. **"Open Prisma Studio"** → Claude can run `npm run db:studio` or `npx prisma studio`
2. **"Show recent searches"** → Claude can run SQL queries via Prisma CLI
3. **"What's in the database?"** → Claude can read this file and execute queries

**Example prompt:**
```
"Hey Claude, open Prisma Studio so I can view the search logs from today"
```

Claude will:
1. Read this file for connection details
2. Run `npx prisma studio`
3. Confirm it's available at http://localhost:5555

---

## 🚀 Quick Start for Admin Panel

### Option 1: Build It Yourself

See `ADMIN_PANEL_PLAN.md` for implementation guide.

### Option 2: Use Prisma Studio (Current)

Already works! Just run:
```bash
npx prisma studio
```

### Option 3: Third-Party Tools

**pgAdmin** (GUI for PostgreSQL):
```bash
# Install pgAdmin
brew install --cask pgadmin4

# Connection details:
Host: 154.12.252.80
Port: 6432
Database: hotel_booking
Username: hotel_booking_user
Password: CXmJLlDK4SxBKarY/lc5AWTRHbS3jKTr
```

**DBeaver** (Universal database tool):
```bash
# Install DBeaver
brew install --cask dbeaver-community

# Same connection details as above
```

---

## 📊 Analytics Queries

### Search Volume by Date

```sql
SELECT
  DATE("createdAt") as date,
  COUNT(*) as searches,
  SUM("resultsCount") as total_hotels
FROM "SearchLog"
WHERE status = 'success'
GROUP BY DATE("createdAt")
ORDER BY date DESC
LIMIT 30;
```

### Average Response Time

```sql
SELECT
  AVG("responseTime") as avg_ms,
  MIN("responseTime") as min_ms,
  MAX("responseTime") as max_ms
FROM "SearchLog"
WHERE status = 'success';
```

### Top Hotels by Appearance

```sql
SELECT
  "hotelName",
  "city",
  COUNT(*) as appearance_count,
  AVG("lowestRate") as avg_rate
FROM "HotelResult"
GROUP BY "hotelName", "city"
ORDER BY appearance_count DESC
LIMIT 20;
```

---

## 🔄 Backup & Restore

### Create Backup

```bash
# From VPS
ssh root@154.12.252.80
PGPASSWORD='CXmJLlDK4SxBKarY/lc5AWTRHbS3jKTr' pg_dump -h localhost -p 6432 -U hotel_booking_user hotel_booking > backup_$(date +%Y%m%d).sql

# Or from local machine
PGPASSWORD='CXmJLlDK4SxBKarY/lc5AWTRHbS3jKTr' pg_dump -h 154.12.252.80 -p 6432 -U hotel_booking_user hotel_booking > backup_$(date +%Y%m%d).sql
```

### Restore Backup

```bash
PGPASSWORD='CXmJLlDK4SxBKarY/lc5AWTRHbS3jKTr' psql -h 154.12.252.80 -p 6432 -U hotel_booking_user hotel_booking < backup_20260116.sql
```

---

## 📞 Support

**Database Issues:**
- Check VPS status: `ssh root@154.12.252.80 "systemctl status postgresql pgbouncer"`
- View logs: `ssh root@154.12.252.80 "tail -100 /var/log/postgresql/pgbouncer.log"`
- Restart services: `ssh root@154.12.252.80 "systemctl restart pgbouncer"`

**Connection Issues:**
- Verify DATABASE_URL in `.env.local` is correct
- Ensure password is URL-encoded (`%2F` for `/`)
- Test connection: `npx prisma db execute --stdin <<< "SELECT 1;"`

---

**Last Updated:** 2026-01-16
**Database Setup Date:** 2026-01-16
**Location:** Contabo VPS (154.12.252.80)
