#!/bin/bash

# BOTAXXX - Quick Update Script
# Script cepat untuk update aplikasi di VPS
# Usage: sudo bash quick-update-vps.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

APP_DIR="/var/www/botaxxx"
APP_USER="www-data"

echo ""
print_info "🚀 BOTAXXX Quick Update"
echo "================================"
echo ""

# Step 1: Pull latest changes
print_info "Step 1/6: Pulling latest changes from GitHub..."
cd $APP_DIR
git pull origin main
if [ $? -eq 0 ]; then
    print_success "Git pull successful"
else
    print_error "Git pull failed. Check your connection and repository."
    exit 1
fi
chown -R $APP_USER:$APP_USER $APP_DIR
echo ""

# Step 2: Update Backend
print_info "Step 2/6: Updating backend..."
cd $APP_DIR/backend
source venv/bin/activate
pip install -r requirements.txt --quiet --disable-pip-version-check 2>/dev/null || true
print_success "Backend dependencies updated"
echo ""

# Step 3: Run Migrations
print_info "Step 3/6: Running database migrations..."
alembic upgrade head
if [ $? -eq 0 ]; then
    print_success "Migrations completed"
else
    print_warning "Migration may have issues. Check logs if needed."
fi
echo ""

# Step 4: Rebuild Frontend
print_info "Step 4/6: Rebuilding frontend (this may take a minute)..."
cd $APP_DIR/dashboard
npm install --silent 2>/dev/null || true
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed. Check logs above."
    exit 1
fi
chown -R $APP_USER:$APP_USER $APP_DIR/dashboard/dist
echo ""

# Step 5: Update Bot
print_info "Step 5/6: Updating bot dependencies..."
cd $APP_DIR/bot
source venv/bin/activate
pip install -r requirements.txt --quiet --disable-pip-version-check 2>/dev/null || true
print_success "Bot dependencies updated"
echo ""

# Step 6: Restart Services
print_info "Step 6/6: Restarting services..."
systemctl restart botaxxx-backend
sleep 2
systemctl restart botaxxx-bot
sleep 1
systemctl reload nginx
print_success "Services restarted"
echo ""

# Wait a moment
sleep 3

# Check service status
echo ""
print_info "Checking service status..."
echo ""

if systemctl is-active --quiet botaxxx-backend; then
    print_success "Backend service: RUNNING"
else
    print_error "Backend service: FAILED"
    print_warning "Check logs: journalctl -u botaxxx-backend -n 50"
fi

if systemctl is-active --quiet botaxxx-bot; then
    print_success "Bot service: RUNNING"
else
    print_warning "Bot service: FAILED (may be normal if bot token not set)"
fi

if systemctl is-active --quiet nginx; then
    print_success "Nginx service: RUNNING"
else
    print_error "Nginx service: FAILED"
fi

echo ""
echo "================================"
print_success "Update completed!"
echo ""
print_info "Useful commands:"
echo "  Status:  systemctl status botaxxx-backend botaxxx-bot"
echo "  Logs:    journalctl -u botaxxx-backend -f"
echo "  Test:    curl http://localhost:8000/health"
echo ""

