#!/bin/bash
set -e

echo "============================================"
echo "Local Development Environment Setup Script"
echo "============================================"
echo ""
echo "This script will configure your local machine to connect"
echo "to the centralized PostgreSQL database on the VPS"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check we're in the project directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}ERROR: Not in project directory!${NC}"
    echo "Run this from: /Users/lukaszbulik/Documents/projects/hotel-booking"
    exit 1
fi

# Phase 1: Create PostgreSQL directory
echo -e "${GREEN}[Phase 1] Creating PostgreSQL certificate directory${NC}"
mkdir -p ~/.postgresql
echo -e "${GREEN}✓ Directory created: ~/.postgresql${NC}"

# Phase 2: Download SSL certificate
echo -e "\n${GREEN}[Phase 2] Downloading SSL Certificate${NC}"
echo ""
echo "Please ensure you have SSH access to the VPS..."
echo "Downloading certificate from VPS..."

if scp root@154.12.252.80:/etc/postgresql/ssl/server.crt ~/.postgresql/root.crt 2>/dev/null; then
    chmod 644 ~/.postgresql/root.crt
    echo -e "${GREEN}✓ SSL certificate downloaded${NC}"
else
    echo -e "${YELLOW}Automatic download failed. Manual method:${NC}"
    echo ""
    echo "On VPS, run:"
    echo "  cat /etc/postgresql/ssl/server.crt"
    echo ""
    echo "Then on local machine, run:"
    echo "  nano ~/.postgresql/root.crt"
    echo "  # Paste the certificate content"
    echo "  # Save and exit (Ctrl+X, Y, Enter)"
    echo "  chmod 644 ~/.postgresql/root.crt"
    echo ""
    read -p "Press Enter once you've manually copied the certificate..."
fi

# Verify certificate exists
if [ ! -f ~/.postgresql/root.crt ]; then
    echo -e "${RED}ERROR: Certificate not found at ~/.postgresql/root.crt${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Certificate verified${NC}"

# Phase 3: Update .env.local
echo -e "\n${GREEN}[Phase 3] Updating .env.local${NC}"

# Prompt for password
echo ""
echo "Enter the password for hotel_booking_user on the VPS:"
read -s DB_PASSWORD
echo ""

# Backup existing .env.local
if [ -f .env.local ]; then
    cp .env.local .env.local.backup
    echo -e "${GREEN}✓ Backed up existing .env.local${NC}"
fi

# Read existing .env.local and update DATABASE_URL
if [ -f .env.local ]; then
    # Remove old DATABASE_URL line
    grep -v "^DATABASE_URL=" .env.local > .env.local.tmp || true
    mv .env.local.tmp .env.local
fi

# Add new DATABASE_URL
echo "" >> .env.local
echo "# Centralized Database on VPS (configured $(date +%Y-%m-%d))" >> .env.local
echo "DATABASE_URL=\"postgresql://hotel_booking_user:${DB_PASSWORD}@154.12.252.80:6432/hotel_booking?sslmode=require&connect_timeout=10&pool_timeout=10&application_name=hotel-booking-dev\"" >> .env.local

echo -e "${GREEN}✓ Updated .env.local${NC}"

# Phase 4: Test Connection
echo -e "\n${GREEN}[Phase 4] Testing Connection${NC}"

# Test with psql (if available)
if command -v psql &> /dev/null; then
    echo "Testing PostgreSQL connection..."
    if psql "postgresql://hotel_booking_user:${DB_PASSWORD}@154.12.252.80:6432/hotel_booking?sslmode=require" -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL connection successful${NC}"
    else
        echo -e "${YELLOW}WARNING: PostgreSQL connection test failed${NC}"
        echo "This is OK if psql is not installed. Test with Prisma instead."
    fi
else
    echo -e "${YELLOW}psql not found, skipping connection test${NC}"
fi

# Test with Prisma
echo ""
echo "Testing Prisma connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Prisma connection successful${NC}"
else
    echo -e "${YELLOW}WARNING: Prisma connection test failed${NC}"
    echo "You may need to run: npx prisma generate"
fi

# Phase 5: Summary
echo -e "\n${GREEN}==========================================="
echo "Local Environment Setup Complete!"
echo "===========================================${NC}"
echo ""
echo "Your local development environment is now configured"
echo "to use the centralized PostgreSQL database on the VPS."
echo ""
echo "Test your setup:"
echo "  npm run dev"
echo "  # Then search for hotels at http://localhost:3000"
echo ""
echo "Verify data in remote database:"
echo "  npx prisma studio"
echo ""
echo "Connection details:"
echo "  Host: 154.12.252.80"
echo "  Port: 6432 (PgBouncer)"
echo "  Database: hotel_booking"
echo "  SSL: Required"
echo ""
echo -e "${YELLOW}Note: Searches will be 3-5 seconds on first search (remote latency)"
echo "Cached searches should still be fast (0.1-0.5 seconds)${NC}"
