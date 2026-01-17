# Centralized Database Setup Guide

## Quick Start

Follow these steps to set up the centralized PostgreSQL database on your Contabo VPS (154.12.252.80).

---

## Prerequisites

- ✅ VPS accessible at 154.12.252.80
- ✅ PostgreSQL installed on VPS
- ✅ Root SSH access to VPS
- ✅ Database `hotel_booking` exists
- ✅ User `hotel_booking_user` exists with password

---

## Setup Process (3 Steps)

### Step 1: Configure VPS PostgreSQL (15-20 min)

SSH into your VPS and run the setup script:

```bash
# On your local machine
cd /Users/lukaszbulik/Documents/projects/hotel-booking
scp scripts/setup-vps-database.sh root@154.12.252.80:/root/
scp scripts/setup-pgbouncer.sh root@154.12.252.80:/root/

# SSH into VPS
ssh root@154.12.252.80

# Run PostgreSQL setup
chmod +x /root/setup-vps-database.sh
./setup-vps-database.sh
```

**What this does:**
- ✅ Generates SSL certificates for encryption
- ✅ Configures PostgreSQL to accept remote connections
- ✅ Enforces SSL-only connections (security)
- ✅ Opens firewall port 5432
- ✅ Restarts PostgreSQL with new configuration

**Expected output:**
```
PostgreSQL Configuration Complete!
✓ SSL is enabled
✓ PostgreSQL listening on all interfaces
```

**Save the SSL certificate output!** You'll need it for Step 3.

---

### Step 2: Install and Configure PgBouncer (10-15 min)

Still on the VPS:

```bash
# Run PgBouncer setup
chmod +x /root/setup-pgbouncer.sh
./setup-pgbouncer.sh
```

**What this does:**
- ✅ Installs PgBouncer connection pooler
- ✅ Configures session-based pooling (Prisma compatible)
- ✅ Sets up authentication (you'll be prompted for password)
- ✅ Opens firewall port 6432
- ✅ Starts PgBouncer service

**Expected output:**
```
PgBouncer Setup Complete!
✓ PgBouncer is running
✓ PgBouncer listening on all interfaces
✓ PgBouncer connection test successful
```

**Important:** Save the DATABASE_URL strings shown in the output!

---

### Step 3: Configure Local Development (5-10 min)

Back on your local machine:

```bash
cd /Users/lukaszbulik/Documents/projects/hotel-booking
./scripts/setup-local-env.sh
```

**What this does:**
- ✅ Downloads SSL certificate from VPS
- ✅ Updates local .env.local with remote DATABASE_URL
- ✅ Tests connection to VPS database
- ✅ Verifies Prisma can connect

**You'll be prompted for:**
- VPS database password (hotel_booking_user password)

**Expected output:**
```
Local Environment Setup Complete!
✓ SSL certificate downloaded
✓ Updated .env.local
✓ PostgreSQL connection successful
✓ Prisma connection successful
```

---

## Verification

### Test Local Development

```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000

# Perform a hotel search
# Expected: 3-5 seconds first search, 0.1s cached searches
```

### Check VPS Database

```bash
# View data with Prisma Studio
npx prisma studio

# Should show data from VPS database
```

### Monitor PgBouncer

```bash
# SSH into VPS
ssh root@154.12.252.80

# Check connection pool stats
psql -h localhost -p 6432 -U postgres pgbouncer -c "SHOW POOLS;"

# Expected output shows pooling is working:
# cl_active: 10 (client connections)
# sv_active: 5  (server connections - reduced by pooling!)
```

---

## Update VPS Production App

After completing the setup, update your production app on the VPS:

```bash
# SSH into VPS
ssh root@154.12.252.80
cd /root/hotel-booking

# Update .env.local (use the DATABASE_URL from Step 2 output)
nano .env.local
```

**Update DATABASE_URL to:**
```bash
DATABASE_URL="postgresql://hotel_booking_user:YOUR_PASSWORD@localhost:6432/hotel_booking?connect_timeout=5&application_name=hotel-booking-prod"
```

**Run migrations:**
```bash
npx prisma generate
npx prisma migrate deploy
```

**Restart app:**
```bash
pm2 restart hotel-booking
pm2 logs hotel-booking --lines 50
```

**Verify no database errors:**
```bash
# Check logs
pm2 logs hotel-booking | grep -i "database\|error"

# Should see no "PrismaClientInitializationError"
```

---

## Troubleshooting

### Connection Refused

**Symptom:** `could not connect to server: Connection refused`

**Check on VPS:**
```bash
systemctl status postgresql
netstat -tulpn | grep 5432
ufw status | grep 5432
```

**Fix:**
```bash
systemctl restart postgresql
ufw allow 5432/tcp
ufw reload
```

### SSL Error

**Symptom:** `FATAL: no pg_hba.conf entry for host`

**Check on VPS:**
```bash
cat /etc/postgresql/*/main/pg_hba.conf | grep hostssl
```

**Should show:**
```
hostssl hotel_booking hotel_booking_user 0.0.0.0/0 md5
```

### PgBouncer Connection Failed

**Symptom:** `password authentication failed`

**Fix on VPS:**
```bash
# Regenerate password hash
echo -n "YOUR_PASSWORDhotel_booking_user" | md5sum | awk '{print "md5"$1}'

# Update userlist.txt
nano /etc/pgbouncer/userlist.txt
# Replace hash with new one

# Restart PgBouncer
systemctl restart pgbouncer
```

### Slow Queries (>1 second)

**Expected:** 100-300ms for remote queries

**If slower, check:**
```bash
# On VPS - check pool status
psql -h localhost -p 6432 -U postgres pgbouncer -c "SHOW POOLS;"

# Check VPS load
top

# Check PostgreSQL connections
psql -U hotel_booking_user -d hotel_booking -c "SELECT count(*) FROM pg_stat_activity;"
```

---

## Rollback to Local Database

If you need to revert:

```bash
# 1. Backup VPS data
pg_dump "postgresql://hotel_booking_user:PASSWORD@154.12.252.80:6432/hotel_booking?sslmode=require" -F custom -f ~/hotel_booking_backup.dump

# 2. Start local PostgreSQL
brew services start postgresql@15

# 3. Restore locally
createdb hotel_booking
pg_restore -d hotel_booking ~/hotel_booking_backup.dump

# 4. Update .env.local
# Change DATABASE_URL back to:
# DATABASE_URL="postgresql://user:password@localhost:5432/hotel_booking?schema=public"

# 5. Restart dev server
npm run dev
```

---

## Architecture

**Before (Isolated Databases):**
```
Local Dev → localhost:5432/hotel_booking (isolated)
VPS Prod  → localhost:5432/hotel_booking (isolated)
```

**After (Centralized Database):**
```
Local Dev → Internet → SSL → VPS:6432 (PgBouncer) → VPS:5432 (PostgreSQL)
VPS Prod  → localhost:6432 (PgBouncer) → localhost:5432 (PostgreSQL)
```

**Benefits:**
- ✅ Single source of truth (all data in one place)
- ✅ Unified analytics (same data for local and production)
- ✅ Connection pooling (PgBouncer prevents exhaustion)
- ✅ SSL encryption (secure remote access)
- ✅ Work from anywhere (no IP whitelist)
- ✅ Zero additional cost (uses existing VPS)

---

## Security

**Current Setup:**
- ✅ SSL encryption required for all remote connections
- ✅ Password authentication (MD5 hashed)
- ✅ Non-SSL connections rejected
- ✅ Connection pooling prevents DoS
- ✅ Automated daily backups (configured separately)

**Recommended:**
- Use strong password (20+ characters, mixed case, numbers, symbols)
- Rotate password every 90 days
- Monitor connection logs regularly
- Keep PostgreSQL and PgBouncer updated

---

## Monitoring

### Daily Health Check

```bash
# SSH into VPS
ssh root@154.12.252.80

# Check PostgreSQL
systemctl status postgresql
psql -U hotel_booking_user -d hotel_booking -c "SELECT COUNT(*) FROM \"SearchLog\";"

# Check PgBouncer
systemctl status pgbouncer
psql -h localhost -p 6432 -U postgres pgbouncer -c "SHOW POOLS;"

# Check firewall
ufw status | grep -E "5432|6432"
```

### Performance Monitoring

```bash
# Connection pool stats
psql -h localhost -p 6432 -U postgres pgbouncer -c "SHOW STATS;"

# Active connections
psql -U hotel_booking_user -d hotel_booking -c "SELECT count(*), application_name FROM pg_stat_activity WHERE datname='hotel_booking' GROUP BY application_name;"

# Slow queries
psql -U hotel_booking_user -d hotel_booking -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"
```

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review VPS logs: `journalctl -u postgresql -n 100`
3. Review PgBouncer logs: `journalctl -u pgbouncer -n 100`
4. Test connection manually: `psql "postgresql://hotel_booking_user:PASSWORD@154.12.252.80:6432/hotel_booking?sslmode=require"`

---

## Success Criteria Checklist

After setup, verify all of these:

**VPS:**
- [ ] PostgreSQL listening on 0.0.0.0:5432
- [ ] SSL enabled (`SHOW ssl;` returns `on`)
- [ ] PgBouncer listening on 0.0.0.0:6432
- [ ] Firewall allows ports 5432 and 6432
- [ ] VPS app connecting via localhost:6432

**Local:**
- [ ] SSL certificate at ~/.postgresql/root.crt
- [ ] .env.local updated with remote DATABASE_URL
- [ ] `psql` connects successfully
- [ ] Prisma Studio shows VPS data
- [ ] `npm run dev` starts without database errors
- [ ] Search creates records in VPS database

**Performance:**
- [ ] Local search: 3-5 seconds first time
- [ ] Local search: 0.1-0.5 seconds cached
- [ ] VPS search: <3 seconds
- [ ] No PrismaClientInitializationError in logs

All checked? **Setup complete!** 🎉
