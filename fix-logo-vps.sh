#!/bin/bash

# Script untuk fix logo bank di VPS
# Jalankan: sudo bash fix-logo-vps.sh

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
PUBLIC_BANKS="$APP_DIR/dashboard/public/banks"
DIST_BANKS="$APP_DIR/dashboard/dist/banks"

print_info "=== Fix Bank Logos in VPS ==="
echo ""

# Step 1: Check public folder
print_info "Step 1: Checking logo files in public folder..."
if [ ! -d "$PUBLIC_BANKS" ]; then
    print_error "Folder $PUBLIC_BANKS tidak ada!"
    exit 1
fi

LOGO_COUNT=$(find $PUBLIC_BANKS -name "*.png" 2>/dev/null | wc -l)
if [ "$LOGO_COUNT" -eq 0 ]; then
    print_error "Tidak ada file PNG di $PUBLIC_BANKS"
    print_info "Pastikan logo sudah di-upload ke folder tersebut"
    exit 1
fi

print_success "Found $LOGO_COUNT logo files in public folder"
echo ""

# Step 2: Rebuild frontend
print_info "Step 2: Rebuilding frontend..."
cd $APP_DIR/dashboard
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed!"
    exit 1
fi

print_success "Frontend rebuilt"
echo ""

# Step 3: Check if logos copied to dist
print_info "Step 3: Checking if logos copied to dist folder..."
if [ ! -d "$DIST_BANKS" ]; then
    print_warning "Folder $DIST_BANKS tidak ada, membuat folder..."
    mkdir -p $DIST_BANKS
fi

DIST_LOGO_COUNT=$(find $DIST_BANKS -name "*.png" 2>/dev/null | wc -l)

if [ "$DIST_LOGO_COUNT" -eq 0 ]; then
    print_warning "Logo tidak ter-copy ke dist, copying manually..."
    cp -r $PUBLIC_BANKS/* $DIST_BANKS/ 2>/dev/null || true
    print_success "Logo copied manually"
else
    print_success "Found $DIST_LOGO_COUNT logo files in dist folder"
fi

echo ""

# Step 4: Set permissions
print_info "Step 4: Setting permissions..."
chown -R $APP_USER:$APP_USER $APP_DIR/dashboard/dist
chmod -R 755 $APP_DIR/dashboard/dist/banks

print_success "Permissions set"
echo ""

# Step 5: Reload Nginx
print_info "Step 5: Reloading Nginx..."
systemctl reload nginx

print_success "Nginx reloaded"
echo ""

# Step 6: Verify
print_info "Step 6: Verifying logo files..."
echo ""
echo "Logo files in dist:"
ls -lh $DIST_BANKS/*.png | head -5
echo ""

print_success "=== Fix Complete ==="
echo ""
print_info "Test logo access:"
print_info "  curl http://localhost/banks/bca.png"
echo ""
print_info "Clear browser cache (Ctrl+Shift+R) and refresh the page!"

