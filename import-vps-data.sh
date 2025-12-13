#!/bin/bash

# BOTAXXX - Import Data to New VPS
# Script untuk import semua data dari VPS lama ke VPS baru
# Run dengan: sudo bash import-vps-data.sh /path/to/export/directory
# atau: sudo bash import-vps-data.sh /path/to/backup.tar.gz

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

# Check argument
if [ -z "$1" ]; then
    print_error "Usage: sudo bash import-vps-data.sh /path/to/export/directory"
    print_error "   or: sudo bash import-vps-data.sh /path/to/backup.tar.gz"
    exit 1
fi

# Configuration
APP_DIR="/var/www/botaxxx"
APP_USER="www-data"
DB_NAME="botaxxx_db"
IMPORT_SOURCE="$1"
EXTRACT_DIR="/tmp/botaxxx_import_$$"

print_info "=== BOTAXXX Data Import ==="
echo ""

# Check if source is archive or directory
if [ -f "$IMPORT_SOURCE" ] && [[ "$IMPORT_SOURCE" == *.tar.gz ]]; then
    print_info "Detected archive file, extracting..."
    mkdir -p $EXTRACT_DIR
    tar -xzf "$IMPORT_SOURCE" -C $EXTRACT_DIR
    # Find the extracted directory
    IMPORT_DIR=$(find $EXTRACT_DIR -type d -mindepth 1 -maxdepth 1 | head -1)
    if [ -z "$IMPORT_DIR" ]; then
        print_error "Failed to extract archive"
        exit 1
    fi
    print_success "Archive extracted to: $IMPORT_DIR"
elif [ -d "$IMPORT_SOURCE" ]; then
    IMPORT_DIR="$IMPORT_SOURCE"
    print_info "Using directory: $IMPORT_DIR"
else
    print_error "Source not found: $IMPORT_SOURCE"
    exit 1
fi

# Verify import directory
if [ ! -f "$IMPORT_DIR/metadata.txt" ] && [ ! -f "$IMPORT_DIR/database.dump" ]; then
    print_warning "Metadata not found, but continuing..."
fi

# 1. Import Database
print_info "Step 1: Importing database..."
if [ -f "$IMPORT_DIR/database.dump" ]; then
    print_warning "This will overwrite existing database!"
    read -p "Continue? (y/n): " CONFIRM
    if [ "$CONFIRM" = "y" ]; then
        # Drop existing database and recreate
        sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
        sudo -u postgres createdb $DB_NAME
        
        # Restore database
        sudo -u postgres pg_restore -d $DB_NAME $IMPORT_DIR/database.dump && \
            print_success "Database imported successfully" || \
            print_error "Database import failed"
    else
        print_warning "Database import skipped"
    fi
else
    print_warning "Database dump not found, skipping..."
fi

# 2. Import .env files (merge, don't overwrite)
print_info "Step 2: Importing configuration files..."
if [ -f "$IMPORT_DIR/backend.env" ]; then
    if [ -f "$APP_DIR/backend/.env" ]; then
        print_info "Merging backend .env..."
        # Backup current .env
        cp $APP_DIR/backend/.env $APP_DIR/backend/.env.backup.$(date +%Y%m%d_%H%M%S)
        # Merge important values (keep DATABASE_URL from new VPS)
        while IFS='=' read -r key value; do
            if [[ ! "$key" =~ ^# ]] && [[ "$key" != "DATABASE_URL" ]] && [[ -n "$key" ]]; then
                # Update or add the key
                if grep -q "^$key=" $APP_DIR/backend/.env; then
                    sed -i "s|^$key=.*|$key=$value|" $APP_DIR/backend/.env
                else
                    echo "$key=$value" >> $APP_DIR/backend/.env
                fi
            fi
        done < $IMPORT_DIR/backend.env
        print_success "Backend .env merged"
    else
        cp $IMPORT_DIR/backend.env $APP_DIR/backend/.env
        print_success "Backend .env imported"
    fi
fi

if [ -f "$IMPORT_DIR/bot.env" ]; then
    if [ -f "$APP_DIR/bot/.env" ]; then
        print_info "Merging bot .env..."
        cp $APP_DIR/bot/.env $APP_DIR/bot/.env.backup.$(date +%Y%m%d_%H%M%S)
        # Keep API_BASE_URL as localhost, update TELEGRAM_BOT_TOKEN
        while IFS='=' read -r key value; do
            if [[ ! "$key" =~ ^# ]] && [[ "$key" != "API_BASE_URL" ]] && [[ -n "$key" ]]; then
                if grep -q "^$key=" $APP_DIR/bot/.env; then
                    sed -i "s|^$key=.*|$key=$value|" $APP_DIR/bot/.env
                else
                    echo "$key=$value" >> $APP_DIR/bot/.env
                fi
            fi
        done < $IMPORT_DIR/bot.env
        print_success "Bot .env merged"
    else
        cp $IMPORT_DIR/bot.env $APP_DIR/bot/.env
        # Ensure API_BASE_URL is localhost
        if ! grep -q "API_BASE_URL" $APP_DIR/bot/.env; then
            echo "API_BASE_URL=http://localhost:8000" >> $APP_DIR/bot/.env
        fi
        print_success "Bot .env imported"
    fi
fi

if [ -f "$IMPORT_DIR/dashboard.env" ]; then
    if [ -f "$APP_DIR/dashboard/.env" ]; then
        print_info "Merging dashboard .env..."
        cp $APP_DIR/dashboard/.env $APP_DIR/dashboard/.env.backup.$(date +%Y%m%d_%H%M%S)
        # Update VITE_API_BASE_URL to match new VPS
        while IFS='=' read -r key value; do
            if [[ ! "$key" =~ ^# ]] && [[ "$key" != "VITE_API_BASE_URL" ]] && [[ -n "$key" ]]; then
                if grep -q "^$key=" $APP_DIR/dashboard/.env; then
                    sed -i "s|^$key=.*|$key=$value|" $APP_DIR/dashboard/.env
                else
                    echo "$key=$value" >> $APP_DIR/dashboard/.env
                fi
            fi
        done < $IMPORT_DIR/dashboard.env
        print_success "Dashboard .env merged"
    else
        cp $IMPORT_DIR/dashboard.env $APP_DIR/dashboard/.env
        print_success "Dashboard .env imported"
    fi
fi

# 3. Import user avatars
print_info "Step 3: Importing user avatars..."
if [ -d "$IMPORT_DIR/avatars" ]; then
    mkdir -p $APP_DIR/dashboard/public/avatars
    cp -r $IMPORT_DIR/avatars/* $APP_DIR/dashboard/public/avatars/ 2>/dev/null || true
    chown -R $APP_USER:$APP_USER $APP_DIR/dashboard/public/avatars
    print_success "User avatars imported"
else
    print_warning "Avatars directory not found, skipping..."
fi

# 4. Import bank logos
print_info "Step 4: Importing bank logos..."
if [ -d "$IMPORT_DIR/banks" ]; then
    mkdir -p $APP_DIR/dashboard/public/banks
    cp -r $IMPORT_DIR/banks/* $APP_DIR/dashboard/public/banks/ 2>/dev/null || true
    chown -R $APP_USER:$APP_USER $APP_DIR/dashboard/public/banks
    print_success "Bank logos imported"
else
    print_warning "Banks directory not found, skipping..."
fi

# 5. Set permissions
print_info "Step 5: Setting permissions..."
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR

# 6. Restart services
print_info "Step 6: Restarting services..."
systemctl restart botaxxx-backend 2>/dev/null || print_warning "Backend service not found or failed to restart"
systemctl restart botaxxx-bot 2>/dev/null || print_warning "Bot service not found or failed to restart"
systemctl reload nginx 2>/dev/null || print_warning "Nginx reload failed"

# Cleanup
if [ -d "$EXTRACT_DIR" ]; then
    rm -rf $EXTRACT_DIR
fi

echo ""
print_success "Import completed!"
echo ""
print_info "Next steps:"
echo "  1. Verify services are running:"
echo "     sudo systemctl status botaxxx-backend botaxxx-bot"
echo ""
echo "  2. Check logs if there are issues:"
echo "     sudo journalctl -u botaxxx-backend -n 50"
echo ""
echo "  3. Test the application in browser"
echo ""
print_info "All data has been imported successfully!"

