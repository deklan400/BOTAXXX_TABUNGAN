#!/bin/bash

# Script untuk rebuild frontend di VPS agar logo bank muncul
# Jalankan di VPS: sudo bash rebuild-frontend-vps.sh

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

APP_DIR="/var/www/botaxxx"
APP_USER="www-data"

print_info "Rebuilding frontend to include bank logos..."

# Step 1: Check if logo files exist
print_info "Checking bank logos in public folder..."
LOGO_COUNT=$(find $APP_DIR/dashboard/public/banks -name "*.png" 2>/dev/null | wc -l)

if [ "$LOGO_COUNT" -eq 0 ]; then
    print_warning "No PNG files found in $APP_DIR/dashboard/public/banks/"
    print_info "Make sure logo files are in: $APP_DIR/dashboard/public/banks/"
    exit 1
fi

print_success "Found $LOGO_COUNT logo files"

# Step 2: Rebuild frontend
print_info "Rebuilding frontend (this will copy logos to dist/)..."
cd $APP_DIR/dashboard
npm run build

# Step 3: Set correct permissions
print_info "Setting permissions..."
chown -R $APP_USER:$APP_USER $APP_DIR/dashboard/dist

# Step 4: Reload Nginx
print_info "Reloading Nginx..."
systemctl reload nginx

print_success "Frontend rebuilt successfully!"
print_info "Bank logos should now be visible in the dashboard"
print_info "Check: ls -la $APP_DIR/dashboard/dist/banks/"

