#!/bin/bash

# Script untuk fix Nginx config agar logo bank bisa di-serve sebagai static file
# Jalankan: sudo bash fix-nginx-banks.sh

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

NGINX_CONFIG="/etc/nginx/sites-available/botaxxx"
BACKUP_CONFIG="/etc/nginx/sites-available/botaxxx.backup.$(date +%Y%m%d_%H%M%S)"

print_info "=== Fix Nginx Config for Bank Logos ==="
echo ""

# Backup config
print_info "Backing up current config..."
cp $NGINX_CONFIG $BACKUP_CONFIG
print_success "Backup saved to: $BACKUP_CONFIG"
echo ""

# Check if config exists
if [ ! -f "$NGINX_CONFIG" ]; then
    print_error "Nginx config not found: $NGINX_CONFIG"
    exit 1
fi

# Check if config has the problematic pattern
if ! grep -q "location ~ \^/(docs|openapi.json|health|auth|users|overview|savings|loans|targets|banks)" "$NGINX_CONFIG"; then
    print_warning "Config pattern not found. May have different structure."
    print_info "Please manually check the config file."
    exit 1
fi

print_info "Creating fixed config..."

# Create temp file with fix
TEMP_CONFIG=$(mktemp)

# Read config and apply fix
awk '
# Add static files location BEFORE the API routes location
/^[[:space:]]*location[[:space:]]+~[[:space:]]+\^\/\(docs\|openapi\.json\|health\|auth\|users\|overview\|savings\|loans\|targets\|banks\)/ {
    # Insert static files location block before this line
    print "    # Serve static bank logos (must be before API routes)"
    print "    location ~ ^/banks/.*\\.(png|jpg|jpeg|svg|gif|webp)$ {"
    print "        root /var/www/botaxxx/dashboard/dist;"
    print "        expires 30d;"
    print "        add_header Cache-Control \"public, immutable\";"
    print "    }"
    print ""
    print "    # Backend API routes (specific paths only)"
    # Modify the location pattern to be more specific
    gsub(/\|banks\)/, "|banks/banks|banks/accounts)")
    print
    next
}
{ print }
' "$NGINX_CONFIG" > "$TEMP_CONFIG"

# Replace original with fixed version
mv "$TEMP_CONFIG" "$NGINX_CONFIG"

print_success "Config updated"
echo ""

# Test config
print_info "Testing Nginx configuration..."
if nginx -t; then
    print_success "Nginx config is valid"
else
    print_error "Nginx config test failed!"
    print_info "Restoring backup..."
    cp $BACKUP_CONFIG $NGINX_CONFIG
    exit 1
fi

echo ""

# Reload Nginx
print_info "Reloading Nginx..."
systemctl reload nginx

print_success "Nginx reloaded"
echo ""

# Verify
print_info "Verifying logo access..."
sleep 1
if curl -s -o /dev/null -w "%{http_code}" http://localhost/banks/bca.png | grep -q "200"; then
    print_success "Logo is accessible! (HTTP 200)"
else
    print_warning "Logo test returned non-200 status"
    print_info "Check: curl -I http://localhost/banks/bca.png"
fi

echo ""
print_success "=== Fix Complete ==="
echo ""
print_info "Test commands:"
print_info "  curl -I http://localhost/banks/bca.png  # Should return 200"
print_info "  curl http://localhost/banks/banks        # Should return JSON"
echo ""
print_info "If something goes wrong, restore backup:"
print_info "  cp $BACKUP_CONFIG $NGINX_CONFIG"
print_info "  nginx -t && systemctl reload nginx"

