#!/bin/bash
set -e

echo "==================================="
echo "PgBouncer Setup Script"
echo "==================================="
echo ""
echo "This script will install and configure PgBouncer"
echo "Run this on your VPS (154.12.252.80) as root"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo -e "${RED}ERROR: PostgreSQL is not running!${NC}"
    echo "Run setup-vps-database.sh first"
    exit 1
fi

# Phase 1: Install PgBouncer
echo -e "${GREEN}[Phase 1] Installing PgBouncer${NC}"
apt update
apt install pgbouncer -y
echo -e "${GREEN}✓ PgBouncer installed${NC}"

# Phase 2: Configure PgBouncer
echo -e "\n${GREEN}[Phase 2] Configuring PgBouncer${NC}"

# Backup original config
if [ -f /etc/pgbouncer/pgbouncer.ini ]; then
    cp /etc/pgbouncer/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini.backup
fi

cat > /etc/pgbouncer/pgbouncer.ini << 'EOF'
[databases]
hotel_booking = host=127.0.0.1 port=5432 dbname=hotel_booking

[pgbouncer]
listen_addr = *
listen_port = 6432
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Pool configuration (session mode for Prisma compatibility)
pool_mode = session
max_client_conn = 500
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 10
reserve_pool_timeout = 3

# Connection management
server_lifetime = 3600
server_idle_timeout = 600
server_connect_timeout = 15

# Timeouts
query_timeout = 120
query_wait_timeout = 120
client_idle_timeout = 0

# Logging
admin_users = postgres
stats_users = postgres
log_connections = 1
log_disconnections = 1
log_pooler_errors = 1
verbose = 1

# Performance
ignore_startup_parameters = extra_float_digits
EOF

echo -e "${GREEN}✓ PgBouncer configuration created${NC}"

# Phase 3: Create Authentication File
echo -e "\n${GREEN}[Phase 3] Setting up Authentication${NC}"

# Prompt for password
echo ""
echo "Enter the password for hotel_booking_user:"
read -s DB_PASSWORD
echo ""

# Generate MD5 hash
MD5_HASH=$(echo -n "${DB_PASSWORD}hotel_booking_user" | md5sum | awk '{print "md5"$1}')

# Create userlist.txt
echo "\"hotel_booking_user\" \"$MD5_HASH\"" > /etc/pgbouncer/userlist.txt
chmod 600 /etc/pgbouncer/userlist.txt
chown postgres:postgres /etc/pgbouncer/userlist.txt

echo -e "${GREEN}✓ Authentication file created${NC}"

# Phase 4: Configure Firewall
echo -e "\n${GREEN}[Phase 4] Configuring Firewall${NC}"
ufw allow 6432/tcp comment 'PgBouncer'
ufw reload
echo -e "${GREEN}✓ Firewall configured for PgBouncer${NC}"

# Phase 5: Start PgBouncer
echo -e "\n${GREEN}[Phase 5] Starting PgBouncer${NC}"
systemctl enable pgbouncer
systemctl restart pgbouncer

# Verify PgBouncer is running
if systemctl is-active --quiet pgbouncer; then
    echo -e "${GREEN}✓ PgBouncer is running${NC}"
else
    echo -e "${RED}ERROR: PgBouncer failed to start!${NC}"
    echo "Check logs: journalctl -u pgbouncer -n 50"
    exit 1
fi

# Verify PgBouncer is listening
LISTEN_OUTPUT=$(netstat -tulpn | grep 6432)
if echo "$LISTEN_OUTPUT" | grep -q "0.0.0.0:6432"; then
    echo -e "${GREEN}✓ PgBouncer listening on all interfaces${NC}"
else
    echo -e "${YELLOW}WARNING: PgBouncer may not be listening on all interfaces${NC}"
    echo "$LISTEN_OUTPUT"
fi

# Phase 6: Test Connection
echo -e "\n${GREEN}[Phase 6] Testing Connection${NC}"
if psql -h 127.0.0.1 -p 6432 -U hotel_booking_user -d hotel_booking -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PgBouncer connection test successful${NC}"
else
    echo -e "${YELLOW}WARNING: Connection test failed. You may need to enter password manually.${NC}"
    echo "Test manually: psql -h 127.0.0.1 -p 6432 -U hotel_booking_user -d hotel_booking"
fi

# Summary
echo -e "\n${GREEN}==================================="
echo "PgBouncer Setup Complete!"
echo "===================================${NC}"
echo ""
echo "PgBouncer is now running on port 6432"
echo ""
echo "Next steps:"
echo "1. Update VPS .env.local:"
echo "   DATABASE_URL=\"postgresql://hotel_booking_user:${DB_PASSWORD}@localhost:6432/hotel_booking?connect_timeout=5&application_name=hotel-booking-prod\""
echo ""
echo "2. Update local .env.local:"
echo "   DATABASE_URL=\"postgresql://hotel_booking_user:${DB_PASSWORD}@154.12.252.80:6432/hotel_booking?sslmode=require&connect_timeout=10&pool_timeout=10&application_name=hotel-booking-dev\""
echo ""
echo "Monitoring commands:"
echo "  psql -h localhost -p 6432 -U postgres pgbouncer -c 'SHOW POOLS;'"
echo "  psql -h localhost -p 6432 -U postgres pgbouncer -c 'SHOW STATS;'"
echo "  systemctl status pgbouncer"
