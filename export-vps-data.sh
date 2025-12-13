#!/bin/bash

# BOTAXXX - Export Data from Old VPS
# Script untuk export semua data dari VPS lama sebelum pindah ke VPS baru
# Run dengan: sudo bash export-vps-data.sh

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

# Configuration
APP_DIR="/var/www/botaxxx"
DB_NAME="botaxxx_db"
EXPORT_DIR="/tmp/botaxxx_export_$(date +%Y%m%d_%H%M%S)"
EXPORT_FILE="/tmp/botaxxx_full_backup_$(date +%Y%m%d_%H%M%S).tar.gz"

print_info "=== BOTAXXX Data Export ==="
echo ""

# Create export directory
mkdir -p $EXPORT_DIR
print_info "Export directory: $EXPORT_DIR"

# 1. Export Database
print_info "Step 1: Exporting database..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    sudo -u postgres pg_dump -Fc $DB_NAME > $EXPORT_DIR/database.dump
    print_success "Database exported: $EXPORT_DIR/database.dump"
else
    print_warning "Database $DB_NAME not found, skipping..."
fi

# 2. Export .env files
print_info "Step 2: Exporting configuration files..."
if [ -f "$APP_DIR/backend/.env" ]; then
    cp $APP_DIR/backend/.env $EXPORT_DIR/backend.env
    print_success "Backend .env exported"
fi

if [ -f "$APP_DIR/bot/.env" ]; then
    cp $APP_DIR/bot/.env $EXPORT_DIR/bot.env
    print_success "Bot .env exported"
fi

if [ -f "$APP_DIR/dashboard/.env" ]; then
    cp $APP_DIR/dashboard/.env $EXPORT_DIR/dashboard.env
    print_success "Dashboard .env exported"
fi

# 3. Export user avatars
print_info "Step 3: Exporting user avatars..."
if [ -d "$APP_DIR/dashboard/public/avatars" ]; then
    mkdir -p $EXPORT_DIR/avatars
    cp -r $APP_DIR/dashboard/public/avatars/* $EXPORT_DIR/avatars/ 2>/dev/null || true
    print_success "User avatars exported"
else
    print_warning "Avatars directory not found, skipping..."
fi

# 4. Export bank logos
print_info "Step 4: Exporting bank logos..."
if [ -d "$APP_DIR/dashboard/public/banks" ]; then
    mkdir -p $EXPORT_DIR/banks
    cp -r $APP_DIR/dashboard/public/banks/* $EXPORT_DIR/banks/ 2>/dev/null || true
    print_success "Bank logos exported"
else
    print_warning "Banks directory not found, skipping..."
fi

# 5. Export deployment info
print_info "Step 5: Exporting deployment information..."
if [ -f "$APP_DIR/deployment_info.txt" ]; then
    cp $APP_DIR/deployment_info.txt $EXPORT_DIR/deployment_info.txt
    print_success "Deployment info exported"
fi

# 6. Create metadata file
print_info "Step 6: Creating metadata..."
cat > $EXPORT_DIR/metadata.txt << EOF
BOTAXXX Data Export
===================
Export Date: $(date)
VPS IP: $(curl -s ifconfig.me 2>/dev/null || echo "Unknown")
Database Name: $DB_NAME

Files included:
- database.dump (PostgreSQL dump)
- backend.env (Backend configuration)
- bot.env (Bot configuration)
- dashboard.env (Dashboard configuration)
- avatars/ (User avatars)
- banks/ (Bank logos)
- deployment_info.txt (Deployment information)

To restore on new VPS:
1. Copy this entire directory to new VPS
2. Run: sudo bash import-vps-data.sh /path/to/export/directory
EOF

print_success "Metadata created"

# 7. Create compressed archive
print_info "Step 7: Creating compressed archive..."
cd /tmp
tar -czf $EXPORT_FILE -C $(dirname $EXPORT_DIR) $(basename $EXPORT_DIR)
print_success "Archive created: $EXPORT_FILE"

# 8. Show file sizes
echo ""
print_info "Export Summary:"
echo "  Export directory: $EXPORT_DIR"
echo "  Archive file: $EXPORT_FILE"
echo "  Archive size: $(du -h $EXPORT_FILE | cut -f1)"
echo ""
print_info "Files exported:"
ls -lh $EXPORT_DIR | tail -n +2
echo ""

# 9. Instructions
print_success "Export completed!"
echo ""
print_info "Next steps:"
echo "  1. Download the archive file:"
echo "     scp root@OLD_VPS_IP:$EXPORT_FILE ."
echo ""
echo "  2. Upload to new VPS:"
echo "     scp $EXPORT_FILE root@NEW_VPS_IP:/tmp/"
echo ""
echo "  3. On new VPS, extract and import:"
echo "     cd /tmp"
echo "     tar -xzf $(basename $EXPORT_FILE)"
echo "     sudo bash import-vps-data.sh $(basename $EXPORT_DIR)"
echo ""
print_info "Or use the archive file directly:"
echo "  On new VPS, run: sudo bash import-vps-data.sh $EXPORT_FILE"

