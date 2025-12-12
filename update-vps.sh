#!/bin/bash

# BOTAXXX - Quick Update Script for VPS
# Run this script on your VPS to update the application
# Usage: sudo bash update-vps.sh

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
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

APP_DIR="/var/www/botaxxx"
APP_USER="www-data"

print_info "Starting update process..."

# Step 1: Pull latest changes
print_info "Step 1: Pulling latest changes from GitHub..."
cd $APP_DIR
git pull origin main
chown -R $APP_USER:$APP_USER $APP_DIR

# Step 2: Update Backend
print_info "Step 2: Updating backend dependencies..."
cd $APP_DIR/backend
source venv/bin/activate
pip install -r requirements.txt --quiet

# Run migrations if needed
print_info "Running database migrations..."
alembic upgrade head

# Step 3: Update Frontend
print_info "Step 3: Updating frontend..."
cd $APP_DIR/dashboard
npm install --silent
npm run build

# Step 4: Update Bot
print_info "Step 4: Updating bot dependencies..."
cd $APP_DIR/bot
source venv/bin/activate
pip install -r requirements.txt --quiet

# Step 5: Restart services
print_info "Step 5: Restarting services..."
systemctl restart botaxxx-backend
systemctl restart botaxxx-bot
systemctl reload nginx

# Wait a moment for services to start
sleep 3

# Check service status
print_info "Checking service status..."
if systemctl is-active --quiet botaxxx-backend; then
    print_success "Backend service is running"
else
    print_error "Backend service failed to start. Check logs: journalctl -u botaxxx-backend -n 50"
fi

if systemctl is-active --quiet botaxxx-bot; then
    print_success "Bot service is running"
else
    print_warning "Bot service failed to start. Check logs: journalctl -u botaxxx-bot -n 50"
fi

print_success "Update completed!"
print_info "Check service status: systemctl status botaxxx-backend botaxxx-bot"
print_info "View logs: journalctl -u botaxxx-backend -f"


