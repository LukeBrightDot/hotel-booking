#!/bin/bash
set -e

echo "==================================="
echo "VPS PostgreSQL Remote Setup Script"
echo "==================================="
echo ""
echo "This script will configure PostgreSQL for secure remote access"
echo "Run this on your VPS (154.12.252.80) as root"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Phase 1: Generate SSL Certificates
echo -e "${GREEN}[Phase 1] Generating SSL Certificates${NC}"
mkdir -p /etc/postgresql/ssl
cd /etc/postgresql/ssl

if [ ! -f server.crt ]; then
    echo "Generating self-signed SSL certificate..."
    openssl req -new -x509 -days 3650 -nodes -text \
      -out server.crt \
      -keyout server.key \
      -subj "/CN=hotel-booking-db"

    chmod 600 server.key
    chown postgres:postgres server.key server.crt
    echo -e "${GREEN}✓ SSL certificates created${NC}"
else
    echo -e "${YELLOW}SSL certificates already exist, skipping...${NC}"
fi

# Phase 2: Find PostgreSQL config directory
echo -e "\n${GREEN}[Phase 2] Configuring PostgreSQL${NC}"
PG_VERSION=$(ls /etc/postgresql/ | head -1)
PG_CONFIG="/etc/postgresql/$PG_VERSION/main"

if [ ! -d "$PG_CONFIG" ]; then
    echo -e "${RED}ERROR: PostgreSQL config directory not found!${NC}"
    exit 1
fi

echo "Found PostgreSQL config: $PG_CONFIG"

# Backup original configs
if [ ! -f "$PG_CONFIG/postgresql.conf.backup" ]; then
    cp "$PG_CONFIG/postgresql.conf" "$PG_CONFIG/postgresql.conf.backup"
    echo -e "${GREEN}✓ Backed up postgresql.conf${NC}"
fi

if [ ! -f "$PG_CONFIG/pg_hba.conf.backup" ]; then
    cp "$PG_CONFIG/pg_hba.conf" "$PG_CONFIG/pg_hba.conf.backup"
    echo -e "${GREEN}✓ Backed up pg_hba.conf${NC}"
fi

# Update postgresql.conf
echo "Updating postgresql.conf..."
cat >> "$PG_CONFIG/postgresql.conf" << 'EOF'

# ===== Remote Access Configuration (Added by setup script) =====
listen_addresses = '*'
ssl = on
ssl_cert_file = '/etc/postgresql/ssl/server.crt'
ssl_key_file = '/etc/postgresql/ssl/server.key'
ssl_prefer_server_ciphers = on
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
log_connections = on
log_disconnections = on
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
EOF

echo -e "${GREEN}✓ Updated postgresql.conf${NC}"

# Update pg_hba.conf
echo "Updating pg_hba.conf..."
cat > "$PG_CONFIG/pg_hba.conf" << 'EOF'
# TYPE  DATABASE        USER                    ADDRESS                 METHOD

# Local connections (for VPS app and maintenance)
local   all             postgres                                        peer
local   all             hotel_booking_user                              md5

# Remote SSL connections (password authentication required)
hostssl hotel_booking   hotel_booking_user      0.0.0.0/0               md5
hostssl hotel_booking   hotel_booking_user      ::/0                    md5

# Reject non-SSL remote connections
hostnossl all           all                     0.0.0.0/0               reject
hostnossl all           all                     ::/0                    reject
EOF

echo -e "${GREEN}✓ Updated pg_hba.conf${NC}"

# Phase 3: Configure Firewall
echo -e "\n${GREEN}[Phase 3] Configuring Firewall${NC}"
ufw allow 5432/tcp comment 'PostgreSQL remote access'
ufw reload
echo -e "${GREEN}✓ Firewall configured${NC}"

# Phase 4: Restart PostgreSQL
echo -e "\n${GREEN}[Phase 4] Restarting PostgreSQL${NC}"
systemctl restart postgresql

# Verify PostgreSQL is running
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}ERROR: PostgreSQL failed to start!${NC}"
    echo "Check logs: journalctl -u postgresql -n 50"
    exit 1
fi

# Verify SSL is enabled
SSL_STATUS=$(sudo -u postgres psql -t -c "SHOW ssl;" | xargs)
if [ "$SSL_STATUS" = "on" ]; then
    echo -e "${GREEN}✓ SSL is enabled${NC}"
else
    echo -e "${RED}WARNING: SSL is not enabled!${NC}"
fi

# Verify listening address
LISTEN_OUTPUT=$(netstat -tulpn | grep 5432)
if echo "$LISTEN_OUTPUT" | grep -q "0.0.0.0:5432"; then
    echo -e "${GREEN}✓ PostgreSQL listening on all interfaces${NC}"
else
    echo -e "${YELLOW}WARNING: PostgreSQL may not be listening on all interfaces${NC}"
    echo "$LISTEN_OUTPUT"
fi

# Phase 5: Display SSL Certificate
echo -e "\n${GREEN}[Phase 5] SSL Certificate${NC}"
echo "Copy this certificate to your local machine (~/.postgresql/root.crt):"
echo "================================================"
cat /etc/postgresql/ssl/server.crt
echo "================================================"

# Summary
echo -e "\n${GREEN}==================================="
echo "PostgreSQL Configuration Complete!"
echo "===================================${NC}"
echo ""
echo "Next steps:"
echo "1. Copy the SSL certificate above to your local machine"
echo "2. Run the PgBouncer setup script: ./setup-pgbouncer.sh"
echo ""
echo "Verification commands:"
echo "  sudo -u postgres psql -c 'SHOW ssl;'"
echo "  netstat -tulpn | grep 5432"
echo "  ufw status | grep 5432"
