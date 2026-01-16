# Deployment Checklist - Quick Reference

**Target:** VPS 154.12.252.80 (Port 3001)
**Date:** _____________
**Deployed By:** _____________

---

## ✅ Pre-Deployment (Local)

- [ ] Code committed to Git
- [ ] `npm run build` succeeds locally
- [ ] All tests pass
- [ ] Environment variables documented
- [ ] Database schema finalized

---

## 🗄️ Phase 1: Database Setup

```bash
ssh root@154.12.252.80
```

### Install PostgreSQL
- [ ] `apt update && apt install postgresql postgresql-contrib -y`
- [ ] `systemctl status postgresql` → active

### Create Database
- [ ] `sudo -u postgres psql`
- [ ] `CREATE DATABASE hotel_booking;`
- [ ] `CREATE USER hotel_booking_user WITH PASSWORD 'SECURE_PASSWORD';`
- [ ] `GRANT ALL PRIVILEGES ON DATABASE hotel_booking TO hotel_booking_user;`
- [ ] Test connection: `psql -U hotel_booking_user -d hotel_booking`

---

## 📦 Phase 2: Application Update

### Pull Latest Code
- [ ] `cd /root/hotel-booking`
- [ ] `git pull origin main`
- [ ] `npm install`

### Configure Environment
- [ ] Edit `.env.local`:
  ```bash
  DATABASE_URL=postgresql://hotel_booking_user:PASSWORD@localhost:5432/hotel_booking
  PORT=3001
  NODE_ENV=production
  SABRE_CLIENT_ID=VD35-Coastline52JL
  SABRE_CLIENT_SECRET=your_secret
  SABRE_PCC=52JL
  SABRE_USERNAME=250463
  SABRE_DOMAIN=AA
  OPENAI_API_KEY=your_key
  ```

### Database Migrations
- [ ] `npx prisma generate`
- [ ] `npx prisma migrate deploy`
- [ ] Verify: `psql -U hotel_booking_user -d hotel_booking -c "\dt"`
  - Should show: SearchLog, HotelResult, Booking, ApiLog

### Build
- [ ] `npm run build`
- [ ] Build completes without errors

---

## 🚀 Phase 3: Deploy

### Start Application
- [ ] `pm2 stop hotel-booking`
- [ ] `pm2 start npm --name "hotel-booking" -- start`
- [ ] `pm2 save`
- [ ] `pm2 status` → hotel-booking is online

### Verify
- [ ] `curl http://localhost:3001/api/auth/test`
  - Returns: `{"status":"success","version":"v2-epr"}`
- [ ] `pm2 logs hotel-booking --lines 50`
  - No errors

---

## 🧪 Phase 4: Testing

### Test Search
- [ ] POST to `http://localhost:3001/api/search/hotels`
  ```bash
  curl -X POST http://localhost:3001/api/search/hotels \
    -H "Content-Type: application/json" \
    -d '{"location":{"name":"Paris","city":"Paris","country":"France"},"checkIn":"2026-03-01","checkOut":"2026-03-03","rooms":1,"adults":2,"children":0}'
  ```
- [ ] Returns hotel results

### Verify Database Logging
- [ ] `psql -U hotel_booking_user -d hotel_booking -c "SELECT COUNT(*) FROM \"SearchLog\";"`
- [ ] Count > 0 (search was logged)

### Test Analytics
- [ ] `curl http://localhost:3001/api/analytics/search-stats?days=7`
- [ ] Returns statistics
- [ ] Visit: `http://154.12.252.80:3001/analytics` in browser
- [ ] Dashboard shows data

### Test Voice Assistant
- [ ] Visit: `http://154.12.252.80:3001/assistant`
- [ ] Voice assistant loads

---

## ✨ Phase 5: Luxury Hotel System

### Run Discovery
- [ ] `cd /root/hotel-booking`
- [ ] `npm run discover-luxury -- --cities="Paris,New York,Tokyo,Dubai,London"`
- [ ] Review output (candidates found → confirmed)

### Update Mappings
- [ ] `npm run update-luxury-mappings -- --merge`
- [ ] Luxury hotels added to database

### Verify Luxury Badges
- [ ] Perform search in browser
- [ ] Luxury badges appear on Four Seasons, Ritz-Carlton, etc.

### Commit Changes
- [ ] `git add src/lib/data/luxury-mapping.ts`
- [ ] `git commit -m "chore: populate luxury hotel database"`
- [ ] `git push origin main`

---

## ⏰ Phase 6: Automated Tasks

### Monthly Luxury Re-Verification
- [ ] `crontab -e`
- [ ] Add: `0 3 1 * * cd /root/hotel-booking && npm run reverify-luxury`

### Daily Database Cleanup
- [ ] Create script: `/root/hotel-booking/scripts/cleanup-old-searches.ts`
- [ ] `crontab -e`
- [ ] Add: `0 4 * * * cd /root/hotel-booking && npx tsx scripts/cleanup-old-searches.ts`

### Daily Database Backup
- [ ] Create script: `/root/backup-db.sh`
  ```bash
  #!/bin/bash
  BACKUP_DIR="/root/backups/postgres"
  mkdir -p $BACKUP_DIR
  FILENAME="hotel_booking_$(date +%Y%m%d_%H%M%S).sql"
  pg_dump -U hotel_booking_user hotel_booking > $BACKUP_DIR/$FILENAME
  find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
  ```
- [ ] `chmod +x /root/backup-db.sh`
- [ ] `crontab -e`
- [ ] Add: `0 2 * * * /root/backup-db.sh`

### Monitoring Script
- [ ] Create script: `/root/monitor-hotel-booking.sh`
  ```bash
  #!/bin/bash
  if ! pm2 describe hotel-booking > /dev/null 2>&1; then
      cd /root/hotel-booking && pm2 start npm --name "hotel-booking" -- start
  fi
  if ! systemctl is-active --quiet postgresql; then
      systemctl start postgresql
  fi
  ```
- [ ] `chmod +x /root/monitor-hotel-booking.sh`
- [ ] `crontab -e`
- [ ] Add: `*/5 * * * * /root/monitor-hotel-booking.sh`

---

## 🔒 Phase 7: Security

### Firewall
- [ ] `ufw allow 22/tcp`
- [ ] `ufw allow 80/tcp`
- [ ] `ufw allow 443/tcp`
- [ ] `ufw enable`
- [ ] `ufw status` → active

### Verify Security
- [ ] `.env.local` not in Git
- [ ] Strong database password used
- [ ] PostgreSQL listening on localhost only
- [ ] API keys are secure

---

## 📊 Phase 8: Final Verification

### All Endpoints Working
- [ ] `http://154.12.252.80:3001/` → Home page loads
- [ ] `http://154.12.252.80:3001/assistant` → Voice assistant loads
- [ ] `http://154.12.252.80:3001/analytics` → Analytics dashboard loads
- [ ] Search returns results with luxury badges
- [ ] Database logging works
- [ ] Analytics show data

### Check Logs
- [ ] `pm2 logs hotel-booking --lines 100`
- [ ] No errors
- [ ] Search logs show "✨ Enriched X hotels - Y luxury properties"

### Database Health
- [ ] `psql -U hotel_booking_user -d hotel_booking -c "SELECT pg_size_pretty(pg_database_size('hotel_booking'));"`
- [ ] Reasonable size
- [ ] Tables have data

---

## 📝 Phase 9: Documentation

### Client Handoff
- [ ] Document URLs:
  - Application: `http://154.12.252.80:3001`
  - Analytics: `http://154.12.252.80:3001/analytics`
  - Voice Assistant: `http://154.12.252.80:3001/assistant`

- [ ] Document credentials:
  - Database user: `hotel_booking_user`
  - Database password: `_______________`
  - Server SSH: `root@154.12.252.80`

- [ ] Share deployment guide: `DEPLOYMENT_GUIDE.md`

---

## ✅ Success Criteria

Deployment is complete when ALL are checked:

- ✅ Application accessible at http://154.12.252.80:3001
- ✅ Database has SearchLog entries after searching
- ✅ Analytics dashboard shows statistics
- ✅ Luxury badges appear on hotel results
- ✅ Voice assistant functions
- ✅ All cron jobs configured
- ✅ Monitoring active
- ✅ Backups scheduled
- ✅ No errors in logs

---

## 🆘 Quick Troubleshooting

**App won't start:**
```bash
pm2 logs hotel-booking --lines 100
```

**Database connection error:**
```bash
systemctl status postgresql
psql -U hotel_booking_user -d hotel_booking -c "SELECT 1;"
```

**No data in analytics:**
```bash
psql -U hotel_booking_user -d hotel_booking -c "SELECT COUNT(*) FROM \"SearchLog\";"
```

**Port already in use:**
```bash
lsof -i :3001
pm2 stop all
```

---

## 🎯 Post-Deployment

- [ ] Monitor logs for 24 hours
- [ ] Verify cron jobs run successfully
- [ ] Check database size daily
- [ ] Review analytics weekly
- [ ] Update luxury mappings monthly

---

**Deployment Status:** ⬜ Not Started / 🟡 In Progress / ✅ Complete
**Deployed On:** _______________
**Deployed By:** _______________
**Notes:** _______________________________________________

---

**For detailed instructions, see:** `DEPLOYMENT_GUIDE.md`
