#!/bin/bash

# BOTAXXX - Complete VPS Installation Script
# Automated installation script for VPS setup from scratch
# Run with: sudo bash install-vps.sh

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
APP_USER="www-data"
DB_NAME="botaxxx_db"
DB_USER="botaxxx"
REPO_URL="https://github.com/deklan400/BOTAXXX_TABUNGAN.git"
BACKUP_DIR="/var/backups/botaxxx"

# Get user inputs
echo ""
print_info "=== BOTAXXX VPS Installation ==="
echo ""
read -p "Enter your domain name (e.g., example.com) or press Enter to use IP: " DOMAIN
read -p "Enter API subdomain (e.g., api.example.com) or press Enter to use same domain: " API_DOMAIN
read -p "Enter email for SSL certificate (optional, press Enter to skip SSL): " SSL_EMAIL
read -p "Enter Telegram Bot Token from @BotFather (optional, can add later): " TELEGRAM_TOKEN

# Ask about backup/restore
echo ""
print_info "=== Migration & Restore Options ==="
echo ""
print_info "Choose one of the following options:"
echo "  1. Fresh installation (new VPS, no data to migrate)"
echo "  2. Migrate from another VPS (have backup file ready)"
echo "  3. Reinstall on same VPS (backup existing data first)"
echo ""
read -p "Enter option (1/2/3, default: 1): " INSTALL_OPTION
INSTALL_OPTION=${INSTALL_OPTION:-1}

case $INSTALL_OPTION in
    1)
        # Fresh installation
        IS_MIGRATION="n"
        BACKUP_EXISTING="n"
        RESTORE_BACKUP="n"
        print_info "Fresh installation selected - no backup/restore needed"
        ;;
    2)
        # Migrate from another VPS
        IS_MIGRATION="y"
        BACKUP_EXISTING="n"
        echo ""
        print_info "=== IMPORTANT: Migration from Another VPS ==="
        echo ""
        print_warning "Before proceeding, make sure you have:"
        echo "  1. Exported data from OLD VPS using: sudo bash export-vps-data.sh"
        echo "  2. Downloaded the backup file to your local machine"
        echo "  3. Uploaded the backup file to THIS VPS"
        echo ""
        read -p "Do you have backup file ready on this VPS? (y/n): " HAS_BACKUP
        if [ "$HAS_BACKUP" = "y" ]; then
            read -p "Enter backup file path (e.g., /tmp/botaxxx_full_backup_*.tar.gz): " BACKUP_FILE
            if [ -f "$BACKUP_FILE" ]; then
                RESTORE_BACKUP="y"
                print_success "Backup file found: $BACKUP_FILE"
                print_info "Data will be imported after installation completes"
            else
                print_error "Backup file not found: $BACKUP_FILE"
                read -p "Continue without backup? (y/n): " CONTINUE_WITHOUT
                if [ "$CONTINUE_WITHOUT" != "y" ]; then
                    print_error "Installation cancelled. Please upload backup file first."
                    exit 1
                fi
                RESTORE_BACKUP="n"
            fi
        else
            RESTORE_BACKUP="n"
            print_warning "No backup file provided"
            print_info "You can import data later using: sudo bash import-vps-data.sh /path/to/backup.tar.gz"
            print_info "Or run export on old VPS: sudo bash export-vps-data.sh"
        fi
        ;;
    3)
        # Reinstall on same VPS
        IS_MIGRATION="n"
        if [ -d "$APP_DIR" ]; then
            read -p "Backup existing data before reinstall? (y/n, default: y): " BACKUP_EXISTING
            BACKUP_EXISTING=${BACKUP_EXISTING:-y}
        else
            BACKUP_EXISTING="n"
        fi
        read -p "Restore from existing backup? (y/n, default: n): " RESTORE_BACKUP
        RESTORE_BACKUP=${RESTORE_BACKUP:-n}
        if [ "$RESTORE_BACKUP" = "y" ]; then
            read -p "Enter backup file path (e.g., /var/backups/botaxxx/backup.tar.gz): " BACKUP_FILE
            if [ ! -f "$BACKUP_FILE" ]; then
                print_warning "Backup file not found: $BACKUP_FILE"
                RESTORE_BACKUP="n"
            fi
        fi
        ;;
    *)
        print_error "Invalid option. Using fresh installation."
        IS_MIGRATION="n"
        BACKUP_EXISTING="n"
        RESTORE_BACKUP="n"
        ;;
esac

if [ -z "$DOMAIN" ]; then
    # Try to get IPv4 address first, fallback to IPv6
    DOMAIN=$(curl -s -4 ifconfig.me 2>/dev/null || curl -s ifconfig.me)
    if [[ $DOMAIN == *":"* ]]; then
        # IPv6 address, format with brackets for URL
        DOMAIN_FORMATTED="[$DOMAIN]"
        print_warning "Using VPS IPv6: $DOMAIN"
        print_info "Note: Use [$DOMAIN] in browser URLs, or use IPv4 if available"
    else
        DOMAIN_FORMATTED="$DOMAIN"
        print_warning "Using VPS IP: $DOMAIN"
    fi
else
    DOMAIN_FORMATTED="$DOMAIN"
fi

if [ -z "$API_DOMAIN" ]; then
    API_DOMAIN="$DOMAIN"
fi

print_info "Starting installation for domain: $DOMAIN"
print_info "API domain: $API_DOMAIN"
echo ""

# Step 0: Create backup directory and handle backup/restore
print_info "Step 0: Setting up backup directory..."
mkdir -p $BACKUP_DIR
chown $APP_USER:$APP_USER $BACKUP_DIR 2>/dev/null || true

# Backup existing data if requested
if [ "$BACKUP_EXISTING" = "y" ] && [ -d "$APP_DIR" ]; then
    print_info "Backing up existing data before reinstall..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE_NAME="botaxxx_backup_before_reinstall_$TIMESTAMP.tar.gz"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE_NAME"
    
    # Check if export script exists and use it for full backup
    if [ -f "$APP_DIR/export-vps-data.sh" ]; then
        print_info "Using export script for complete backup..."
        chmod +x $APP_DIR/export-vps-data.sh
        $APP_DIR/export-vps-data.sh
        # Find the latest export file
        LATEST_EXPORT=$(ls -t /tmp/botaxxx_full_backup_*.tar.gz 2>/dev/null | head -1)
        if [ ! -z "$LATEST_EXPORT" ]; then
            cp $LATEST_EXPORT $BACKUP_PATH
            print_success "Full backup created: $BACKUP_PATH"
        else
            print_warning "Export script completed but backup file not found, creating manual backup..."
            # Fallback to manual backup
            BACKUP_EXISTING="y"
        fi
    fi
    
    # Manual backup if export script didn't work or doesn't exist
    if [ ! -f "$BACKUP_PATH" ] || [ -z "$LATEST_EXPORT" ]; then
        print_info "Creating manual backup..."
        
        # Backup database if exists
        if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
            print_info "Backing up database..."
            sudo -u postgres pg_dump -Fc $DB_NAME > $BACKUP_DIR/db_backup_$TIMESTAMP.dump
            print_success "Database backup created: $BACKUP_DIR/db_backup_$TIMESTAMP.dump"
        fi
        
        # Backup important files
        print_info "Backing up important files..."
        TEMP_BACKUP_DIR="/tmp/botaxxx_backup_$TIMESTAMP"
        mkdir -p $TEMP_BACKUP_DIR
        
        # Copy files to temp directory
        [ -f "$APP_DIR/backend/.env" ] && cp $APP_DIR/backend/.env $TEMP_BACKUP_DIR/backend.env
        [ -f "$APP_DIR/bot/.env" ] && cp $APP_DIR/bot/.env $TEMP_BACKUP_DIR/bot.env
        [ -f "$APP_DIR/dashboard/.env" ] && cp $APP_DIR/dashboard/.env $TEMP_BACKUP_DIR/dashboard.env
        [ -d "$APP_DIR/dashboard/public/avatars" ] && cp -r $APP_DIR/dashboard/public/avatars $TEMP_BACKUP_DIR/ 2>/dev/null || true
        [ -d "$APP_DIR/dashboard/public/banks" ] && cp -r $APP_DIR/dashboard/public/banks $TEMP_BACKUP_DIR/ 2>/dev/null || true
        [ -f "$APP_DIR/deployment_info.txt" ] && cp $APP_DIR/deployment_info.txt $TEMP_BACKUP_DIR/ 2>/dev/null || true
        
        # Create archive
        cd /tmp
        tar -czf $BACKUP_PATH -C /tmp $(basename $TEMP_BACKUP_DIR) 2>/dev/null || print_warning "Some files may not exist for backup"
        rm -rf $TEMP_BACKUP_DIR
        
        print_success "Backup created: $BACKUP_PATH"
    fi
    
    print_info "Backup location: $BACKUP_PATH"
    print_info "Backup size: $(du -h $BACKUP_PATH 2>/dev/null | cut -f1 || echo 'Unknown')"
    print_warning "Keep this backup file safe! You can restore it later if needed."
fi

# Restore from backup if requested (will be done after installation)
if [ "$RESTORE_BACKUP" = "y" ] && [ ! -z "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    print_info "Backup file found: $BACKUP_FILE"
    print_info "Data will be imported after installation completes"
    IMPORT_BACKUP_FILE="$BACKUP_FILE"
else
    IMPORT_BACKUP_FILE=""
fi

# Step 1: Update system
print_info "Step 1/14: Updating system..."
apt update
apt upgrade -y
apt install -y curl wget git build-essential software-properties-common ufw

# Step 2: Setup firewall
print_info "Step 2/13: Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Step 3: Install Python 3.11
print_info "Step 3/13: Installing Python 3.11..."
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev

# Install pip (handle Debian pip issue)
print_info "Installing pip..."
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11 --break-system-packages 2>/dev/null || \
python3.11 -m ensurepip --upgrade --break-system-packages 2>/dev/null || \
print_warning "Pip may already be installed"

# Step 4: Install Node.js
print_info "Step 4/13: Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Step 5: Install PostgreSQL
print_info "Step 5/13: Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Generate random password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create database and user
print_info "Creating database and user..."

# Check if database exists
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")
if [ "$DB_EXISTS" != "1" ]; then
    sudo -u postgres createdb $DB_NAME
    print_success "Database $DB_NAME created"
else
    print_info "Database $DB_NAME already exists"
fi

# Check if user exists
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename='$DB_USER'")
if [ "$USER_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    print_success "Database user $DB_USER created"
else
    # Always update password to ensure it matches
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    print_success "Database user $DB_USER password updated"
fi

# Set privileges
sudo -u postgres psql << EOF
ALTER ROLE $DB_USER SET client_encoding TO 'utf8';
ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';
ALTER ROLE $DB_USER SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT CREATE ON SCHEMA public TO $DB_USER;
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO $DB_USER;
\q
EOF

print_success "Database created with password: $DB_PASSWORD"

# Step 6: Install Nginx
print_info "Step 6/13: Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Step 7: Install Certbot
print_info "Step 7/13: Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Step 8: Create application directory
print_info "Step 8/13: Creating application directory..."
mkdir -p $APP_DIR
chown $APP_USER:$APP_USER $APP_DIR

# Step 9: Clone repository
print_info "Step 9/13: Cloning repository..."
cd $APP_DIR

# Fix git ownership issue
git config --global --add safe.directory $APP_DIR

if [ ! -d ".git" ]; then
    git clone $REPO_URL .
else
    # Handle git pull conflicts
    if ! git pull origin main 2>&1 | grep -q "error: Your local changes"; then
        print_success "Git pull successful"
    else
        print_warning "Git pull failed due to local changes"
        print_info "Stashing local changes and pulling latest..."
        git stash
        git pull origin main || print_warning "Git pull failed after stash, continuing..."
        print_info "Local changes stashed. If needed, recover with: git stash pop"
    fi
fi
chown -R $APP_USER:$APP_USER $APP_DIR

# Step 10: Setup Backend
print_info "Step 10/13: Setting up backend..."
cd $APP_DIR/backend
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip (handle Debian pip issue)
print_info "Installing backend dependencies..."
python3.11 -m pip install --upgrade pip --break-system-packages 2>/dev/null || \
python3.11 -m pip install --upgrade pip --user 2>/dev/null || \
print_warning "Skipping pip upgrade"

pip install -r requirements.txt

# Ensure bcrypt is installed with compatible version (fix for passlib compatibility)
# bcrypt 4.0.0+ is incompatible with passlib 1.7.4
print_info "Ensuring bcrypt version compatibility..."
pip install "bcrypt<4.0.0" || print_warning "bcrypt version check failed, but continuing..."

# Install email-validator if not in requirements
pip install email-validator || print_warning "email-validator may already be installed"

# Generate SECRET_KEY
SECRET_KEY=$(python3.11 -c "import secrets; print(secrets.token_urlsafe(32))")

# Create .env file with correct database password
print_info "Creating backend .env file..."
cat > .env << EOF
# Database
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Security
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://$API_DOMAIN/auth/google/callback

# CORS (support both HTTP and HTTPS)
CORS_ORIGINS=http://$DOMAIN,https://$DOMAIN,http://www.$DOMAIN,https://www.$DOMAIN
FRONTEND_URL=http://$DOMAIN

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60
EOF

chown $APP_USER:$APP_USER .env

# Verify .env file was created correctly
if grep -q "DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD" .env; then
    print_success "Backend .env file created with correct database password"
else
    print_error "Failed to create .env file correctly!"
    exit 1
fi

# Test database connection before migrations
print_info "Testing database connection..."
source venv/bin/activate

# Test with psql first (simpler)
if sudo -u postgres psql -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    print_success "Database connection test passed (psql)"
else
    # If psql test fails, try with password
    PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h localhost -c "SELECT 1;" > /dev/null 2>&1 || {
        print_warning "Direct psql test failed, but continuing with Python test..."
    }
fi

# Test with Python/SQLAlchemy
python3.11 -c "
import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text
try:
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print('ERROR: DATABASE_URL not found in .env')
        exit(1)
    print(f'Testing connection with: postgresql://$DB_USER:***@localhost:5432/$DB_NAME')
    engine = create_engine(db_url)
    with engine.connect() as conn:
        result = conn.execute(text('SELECT 1'))
        print('Database connection successful!')
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
" || {
    print_error "Database connection failed!"
    print_info "Troubleshooting:"
    print_info "1. Check password in .env: grep DATABASE_URL $APP_DIR/backend/.env"
    print_info "2. Check PostgreSQL user: sudo -u postgres psql -c '\\du $DB_USER'"
    print_info "3. Test connection: PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -h localhost -c 'SELECT 1;'"
    exit 1
}

# Run migrations
print_info "Running database migrations..."
source venv/bin/activate
if alembic upgrade head; then
    print_success "Database migrations completed successfully"
else
    print_error "Database migrations failed!"
    print_info "Check error logs above. Common issues:"
    print_info "1. Database permissions - ensure user has CREATE privilege"
    print_info "2. Database connection - check DATABASE_URL in .env"
    print_info "3. Run manually: cd $APP_DIR/backend && source venv/bin/activate && alembic upgrade head"
    exit 1
fi

# Seed bank data if not exists
print_info "Seeding bank data..."
if python3.11 -c "
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
from dotenv import load_dotenv
load_dotenv()
from app.db.session import SessionLocal
from app.models.bank import Bank
db = SessionLocal()
bank_count = db.query(Bank).count()
db.close()
exit(0 if bank_count > 0 else 1)
" 2>/dev/null; then
    print_info "Bank data already exists, skipping seed"
else
    print_info "Seeding bank data..."
    if python3.11 app/db/seed_banks.py 2>/dev/null; then
        print_success "Bank data seeded successfully"
    else
        print_warning "Bank data seeding failed, but continuing..."
        print_info "You can seed manually later: cd $APP_DIR/backend && source venv/bin/activate && python app/db/seed_banks.py"
    fi
fi

# Step 11: Setup Frontend
print_info "Step 11/13: Setting up frontend..."
cd $APP_DIR/dashboard
npm install

# Create .env file
# Use HTTP if no SSL, or if domain is IP address
if [ -z "$SSL_EMAIL" ] || [[ $API_DOMAIN == *"."* && $API_DOMAIN =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] || [[ $API_DOMAIN == *":"* ]]; then
    # HTTP for IP addresses or when SSL not configured
    API_URL="http://$API_DOMAIN"
else
    # HTTPS for domains with SSL
    API_URL="https://$API_DOMAIN"
fi

cat > .env << EOF
VITE_API_BASE_URL=$API_URL
EOF

print_info "Frontend .env created with API URL: $API_URL"

# Build frontend
print_info "Building frontend..."
if npm run build; then
    print_success "Frontend build completed successfully"
else
    print_error "Frontend build failed!"
    print_info "This may be due to TypeScript errors or missing dependencies"
    print_info "You can build manually later: cd $APP_DIR/dashboard && npm run build"
    print_warning "Continuing with installation, but frontend may not work until built"
fi

# Step 12: Setup Bot
print_info "Step 12/13: Setting up bot..."
cd $APP_DIR/bot
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip (handle Debian pip issue)
print_info "Installing bot dependencies..."
python3.11 -m pip install --upgrade pip --break-system-packages 2>/dev/null || \
python3.11 -m pip install --upgrade pip --user 2>/dev/null || \
print_warning "Skipping pip upgrade"

pip install -r requirements.txt

# Install email-validator if not in requirements
pip install email-validator || print_warning "email-validator may already be installed"

# Create .env file
# Use localhost for bot since it's on same server
cat > .env << EOF
# Telegram Bot
TELEGRAM_BOT_TOKEN=${TELEGRAM_TOKEN:-your-telegram-bot-token-here}

# API Configuration (use localhost since bot and backend are on same server)
API_BASE_URL=http://localhost:8000
EOF

chown $APP_USER:$APP_USER .env

# Step 13: Import data from backup if available
if [ "$RESTORE_BACKUP" = "y" ] && [ ! -z "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    print_info "Step 13/18: Importing data from backup..."
    echo ""
    print_warning "=== IMPORTANT: Data Import ==="
    print_warning "This will restore data from backup file: $BACKUP_FILE"
    print_warning "Existing data may be overwritten!"
    echo ""
    read -p "Continue with data import? (y/n): " CONFIRM_IMPORT
    if [ "$CONFIRM_IMPORT" = "y" ]; then
        # Check if import script exists
        if [ -f "$APP_DIR/import-vps-data.sh" ]; then
            print_info "Using import script for data restoration..."
            chmod +x $APP_DIR/import-vps-data.sh
            if $APP_DIR/import-vps-data.sh "$BACKUP_FILE"; then
                print_success "Data imported from backup successfully"
                print_info "Services will be restarted after import"
            else
                print_error "Data import failed!"
                print_warning "You can try importing manually later: sudo bash import-vps-data.sh $BACKUP_FILE"
            fi
        else
            print_warning "Import script not found, using manual restore..."
            RESTORE_DIR="/tmp/botaxxx_restore_$$"
            mkdir -p $RESTORE_DIR
            
            # Extract backup
            if tar -xzf "$BACKUP_FILE" -C $RESTORE_DIR 2>/dev/null; then
                # Find extracted directory
                EXTRACTED_DIR=$(find $RESTORE_DIR -type d -mindepth 1 -maxdepth 1 | head -1)
                
                if [ ! -z "$EXTRACTED_DIR" ]; then
                    # Restore database
                    if [ -f "$EXTRACTED_DIR/database.dump" ]; then
                        print_warning "Database restore will overwrite existing data!"
                        read -p "Restore database? (y/n): " RESTORE_DB
                        if [ "$RESTORE_DB" = "y" ]; then
                            sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
                            sudo -u postgres createdb $DB_NAME
                            if sudo -u postgres pg_restore -d $DB_NAME $EXTRACTED_DIR/database.dump; then
                                print_success "Database restored successfully"
                            else
                                print_error "Database restore failed"
                            fi
                        fi
                    else
                        print_warning "Database dump not found in backup, skipping..."
                    fi
                    
                    # Restore .env files (merge, preserve DATABASE_URL)
                    if [ -f "$EXTRACTED_DIR/backend.env" ]; then
                        print_info "Merging backend .env (preserving DATABASE_URL)..."
                        # Backup current .env
                        cp $APP_DIR/backend/.env $APP_DIR/backend/.env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
                        while IFS='=' read -r key value; do
                            if [[ ! "$key" =~ ^# ]] && [[ "$key" != "DATABASE_URL" ]] && [[ -n "$key" ]]; then
                                if grep -q "^$key=" $APP_DIR/backend/.env 2>/dev/null; then
                                    sed -i "s|^$key=.*|$key=$value|" $APP_DIR/backend/.env
                                else
                                    echo "$key=$value" >> $APP_DIR/backend/.env
                                fi
                            fi
                        done < $EXTRACTED_DIR/backend.env
                        print_success "Backend .env merged"
                    fi
                    
                    if [ -f "$EXTRACTED_DIR/bot.env" ]; then
                        print_info "Merging bot .env (preserving API_BASE_URL)..."
                        cp $APP_DIR/bot/.env $APP_DIR/bot/.env.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
                        while IFS='=' read -r key value; do
                            if [[ ! "$key" =~ ^# ]] && [[ "$key" != "API_BASE_URL" ]] && [[ -n "$key" ]]; then
                                if grep -q "^$key=" $APP_DIR/bot/.env 2>/dev/null; then
                                    sed -i "s|^$key=.*|$key=$value|" $APP_DIR/bot/.env
                                else
                                    echo "$key=$value" >> $APP_DIR/bot/.env
                                fi
                            fi
                        done < $EXTRACTED_DIR/bot.env
                        print_success "Bot .env merged"
                    fi
                    
                    # Restore avatars
                    if [ -d "$EXTRACTED_DIR/avatars" ]; then
                        mkdir -p $APP_DIR/dashboard/public/avatars
                        cp -r $EXTRACTED_DIR/avatars/* $APP_DIR/dashboard/public/avatars/ 2>/dev/null || true
                        chown -R $APP_USER:$APP_USER $APP_DIR/dashboard/public/avatars
                        print_success "User avatars restored"
                    fi
                    
                    # Restore bank logos
                    if [ -d "$EXTRACTED_DIR/banks" ]; then
                        mkdir -p $APP_DIR/dashboard/public/banks
                        cp -r $EXTRACTED_DIR/banks/* $APP_DIR/dashboard/public/banks/ 2>/dev/null || true
                        chown -R $APP_USER:$APP_USER $APP_DIR/dashboard/public/banks
                        print_success "Bank logos restored"
                    fi
                    
                    chown -R $APP_USER:$APP_USER $APP_DIR
                    rm -rf $RESTORE_DIR
                    print_success "Files restored from backup"
                else
                    print_error "Failed to extract backup file"
                fi
            else
                print_error "Failed to extract backup file: $BACKUP_FILE"
            fi
        fi
    else
        print_info "Data import skipped. You can import later using: sudo bash import-vps-data.sh $BACKUP_FILE"
    fi
elif [ "$RESTORE_BACKUP" = "y" ]; then
    print_warning "Backup file not found or not specified: $BACKUP_FILE"
    print_info "You can import data later using: sudo bash import-vps-data.sh /path/to/backup.tar.gz"
fi

# Step 14: Create systemd services
print_info "Step 14/15: Creating systemd services..."

# Create log directory
mkdir -p /var/log/botaxxx
chown $APP_USER:$APP_USER /var/log/botaxxx

# Backend service
cat > /etc/systemd/system/botaxxx-backend.service << EOF
[Unit]
Description=BOTAXXX Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/backend
Environment="PATH=$APP_DIR/backend/venv/bin"
ExecStart=$APP_DIR/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10
StandardOutput=append:/var/log/botaxxx/backend.log
StandardError=append:/var/log/botaxxx/backend.error.log

[Install]
WantedBy=multi-user.target
EOF

# Bot service
cat > /etc/systemd/system/botaxxx-bot.service << EOF
[Unit]
Description=BOTAXXX Telegram Bot
After=network.target botaxxx-backend.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/bot
Environment="PATH=$APP_DIR/bot/venv/bin"
ExecStart=$APP_DIR/bot/venv/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/botaxxx/bot.log
StandardError=append:/var/log/botaxxx/bot.error.log

[Install]
WantedBy=multi-user.target
EOF

# Enable and start services
systemctl daemon-reload
systemctl enable botaxxx-backend botaxxx-bot || print_warning "Failed to enable services"

# Start backend first
print_info "Starting backend service..."
systemctl start botaxxx-backend || print_error "Failed to start backend"

# Wait for backend to be ready
print_info "Waiting for backend to be ready..."
sleep 5
BACKEND_READY=false
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        # Test if API endpoint is actually accessible (check for 404 or valid response)
        sleep 2
        ENDPOINT_TEST=$(curl -s -X POST http://localhost:8000/auth/telegram-login \
            -H "Content-Type: application/json" \
            -d '{"telegram_id":"test"}' 2>&1)
        # If we get a response (not 404), endpoint is ready
        if echo "$ENDPOINT_TEST" | grep -q "Telegram ID not found\|404\|Not Found"; then
            # Got response (even if error), means endpoint exists
            if echo "$ENDPOINT_TEST" | grep -q "404\|Not Found"; then
                # Still 404, wait a bit more
                if [ $i -lt 25 ]; then
                    print_info "Backend health check passed, waiting for API endpoints to be ready... ($i/30)"
                    sleep 2
                    continue
                fi
            fi
            print_success "Backend is ready and API endpoints are accessible!"
            BACKEND_READY=true
            break
        else
            # No response or connection error, wait
            if [ $i -lt 30 ]; then
                print_info "Backend health check passed, waiting for API endpoints to be ready... ($i/30)"
                sleep 2
            fi
        fi
    else
        # Health check failed, wait
        if [ $i -lt 30 ]; then
            sleep 2
        fi
    fi
done

if [ "$BACKEND_READY" = false ]; then
    print_error "Backend failed to start or API endpoints not ready!"
    print_info "Check backend logs: sudo journalctl -u botaxxx-backend -n 50"
    print_info "Check error log: sudo tail -50 /var/log/botaxxx/backend.error.log"
    print_warning "Continuing with installation, but backend may need manual fixing"
    print_info "You may need to restart backend: sudo systemctl restart botaxxx-backend"
fi

# Start bot (only if backend is ready and Telegram token is set)
if [ "$BACKEND_READY" = true ]; then
    if [ ! -z "$TELEGRAM_TOKEN" ] && [ "$TELEGRAM_TOKEN" != "your-telegram-bot-token-here" ]; then
        print_info "Starting bot service..."
        # Wait a bit more to ensure backend is fully ready
        sleep 3
        if systemctl start botaxxx-bot; then
            print_success "Bot service started"
            # Wait and check if bot started successfully
            sleep 3
            if systemctl is-active --quiet botaxxx-bot; then
                print_success "Bot service is running"
            else
                print_warning "Bot service started but may have errors"
                print_info "Check logs: sudo journalctl -u botaxxx-bot -n 20"
            fi
        else
            print_warning "Failed to start bot service"
            print_info "Check logs: sudo journalctl -u botaxxx-bot -n 50"
        fi
    else
        print_warning "Bot service not started - Telegram token not set"
        print_info "Edit $APP_DIR/bot/.env and add TELEGRAM_BOT_TOKEN, then run: sudo systemctl start botaxxx-bot"
    fi
else
    print_warning "Bot service not started - Backend is not ready"
    print_info "Fix backend first, then start bot: sudo systemctl start botaxxx-bot"
    print_info "Or restart both: sudo systemctl restart botaxxx-backend && sleep 5 && sudo systemctl restart botaxxx-bot"
fi

# Step 15: Setup Nginx
print_info "Step 15/15: Setting up Nginx..."

# Create Nginx config
# Check if domain is IPv6
if [[ $DOMAIN == *":"* ]]; then
    # IPv6 address - use default_server and listen on both IPv4 and IPv6
    cat > /etc/nginx/sites-available/botaxxx << EOF
# Backend API
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name $API_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Frontend Dashboard
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/dashboard/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # API proxy fallback (if frontend not built)
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
else
    # Regular domain or IPv4
    # If API_DOMAIN == DOMAIN, combine frontend and backend in one server block
    if [ "$API_DOMAIN" = "$DOMAIN" ]; then
        cat > /etc/nginx/sites-available/botaxxx << EOF
# Combined Frontend and Backend (same domain)
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Backend API routes
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        rewrite ^/api/(.*) /\$1 break;
    }

    # Serve static bank logos (must be before API routes)
    location ~ ^/banks/.*\.(png|jpg|jpeg|svg|gif|webp)$ {
        root $APP_DIR/dashboard/dist;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Backend API direct routes (docs, health, etc) - include admin and maintenance
    location ~ ^/(docs|openapi.json|health|auth|users|overview|savings|loans|targets|banks/banks|banks/accounts|admin|maintenance) {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Frontend Dashboard
    root $APP_DIR/dashboard/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
    else
        # Separate API and Frontend domains
        cat > /etc/nginx/sites-available/botaxxx << EOF
# Backend API
server {
    listen 80;
    listen [::]:80;
    server_name $API_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# Frontend Dashboard
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/dashboard/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF
    fi
fi

# Enable site
ln -sf /etc/nginx/sites-available/botaxxx /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verify frontend dist exists
if [ ! -d "$APP_DIR/dashboard/dist" ]; then
    print_warning "Frontend dist directory not found!"
    print_info "Frontend may not work. Build it: cd $APP_DIR/dashboard && npm run build"
fi

nginx -t || print_error "Nginx configuration test failed"
systemctl reload nginx || print_error "Failed to reload Nginx"

# Step 15: Setup SSL (if email provided)
if [ ! -z "$SSL_EMAIL" ]; then
    print_info "Setting up SSL certificate..."
    print_warning "Make sure your domain DNS points to this server IP!"
    read -p "Press Enter to continue with SSL setup (or Ctrl+C to skip)..."
    
    if [ "$API_DOMAIN" = "$DOMAIN" ]; then
        certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $SSL_EMAIL || \
        print_warning "SSL setup failed. You can run 'sudo certbot --nginx' later after DNS is configured."
    else
        certbot --nginx -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN --non-interactive --agree-tos --email $SSL_EMAIL || \
        print_warning "SSL setup failed. You can run 'sudo certbot --nginx' later after DNS is configured."
    fi
else
    print_info "Skipping SSL setup. Run 'sudo certbot --nginx' later after DNS is configured."
fi

# Step 16: Set permissions
print_info "Setting permissions..."
chown -R $APP_USER:$APP_USER $APP_DIR
chmod -R 755 $APP_DIR

# Step 17: Copy migration scripts
print_info "Step 17/18: Setting up migration scripts..."
if [ -f "$APP_DIR/export-vps-data.sh" ]; then
    cp $APP_DIR/export-vps-data.sh /usr/local/bin/botaxxx-export
    chmod +x /usr/local/bin/botaxxx-export
    print_success "Export script installed: /usr/local/bin/botaxxx-export"
fi

if [ -f "$APP_DIR/import-vps-data.sh" ]; then
    cp $APP_DIR/import-vps-data.sh /usr/local/bin/botaxxx-import
    chmod +x /usr/local/bin/botaxxx-import
    print_success "Import script installed: /usr/local/bin/botaxxx-import"
fi

# Create backup script
print_info "Creating backup script..."
cat > /usr/local/bin/botaxxx-backup << 'BACKUP_SCRIPT'
#!/bin/bash
# BOTAXXX Backup Script
BACKUP_DIR="/var/backups/botaxxx"
APP_DIR="/var/www/botaxxx"
DB_NAME="botaxxx_db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating backup..."
# Backup database
sudo -u postgres pg_dump -Fc $DB_NAME > $BACKUP_DIR/db_backup_$TIMESTAMP.dump

# Backup files
tar -czf $BACKUP_DIR/files_backup_$TIMESTAMP.tar.gz \
    $APP_DIR/backend/.env \
    $APP_DIR/bot/.env \
    $APP_DIR/dashboard/.env \
    $APP_DIR/dashboard/public/avatars/ \
    $APP_DIR/dashboard/public/banks/ \
    $APP_DIR/deployment_info.txt \
    2>/dev/null

echo "Backup created:"
echo "  Database: $BACKUP_DIR/db_backup_$TIMESTAMP.dump"
echo "  Files: $BACKUP_DIR/files_backup_$TIMESTAMP.tar.gz"
echo ""
echo "For full migration export, run: sudo botaxxx-export"
BACKUP_SCRIPT

chmod +x /usr/local/bin/botaxxx-backup
print_success "Backup script created: /usr/local/bin/botaxxx-backup"
print_info "Run 'sudo botaxxx-backup' to create manual backup"
print_info "Run 'sudo botaxxx-export' to export full data for migration"

# Step 18: Save credentials
print_info "Saving deployment information..."
cat > $APP_DIR/deployment_info.txt << EOF
BOTAXXX Deployment Information
==============================

Domain: $DOMAIN
API Domain: $API_DOMAIN

Database:
  Name: $DB_NAME
  User: $DB_USER
  Password: $DB_PASSWORD

Backend:
  SECRET_KEY: $SECRET_KEY

Backup:
  Backup directory: $BACKUP_DIR
  Create backup: sudo botaxxx-backup
  Latest backup: ls -lt $BACKUP_DIR | head -5

Important:
1. Edit $APP_DIR/bot/.env and add your TELEGRAM_BOT_TOKEN if not set
2. Restart bot service: systemctl restart botaxxx-bot
3. Check service status: systemctl status botaxxx-backend botaxxx-bot
4. View logs: journalctl -u botaxxx-backend -f
5. Create backup before major changes: sudo botaxxx-backup

Access URLs:
- Frontend: http://$DOMAIN (or https:// if SSL configured)
- API: http://$API_DOMAIN (or https:// if SSL configured)
- API Docs: http://$API_DOMAIN/docs
EOF

chmod 600 $APP_DIR/deployment_info.txt
chown $APP_USER:$APP_USER $APP_DIR/deployment_info.txt

# Final verification
print_info "Verifying services..."
sleep 5

# Check backend
if systemctl is-active --quiet botaxxx-backend; then
    print_success "Backend service is running"
    # Test API
    sleep 2
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend API is responding"
        HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
        echo "  Health check: $HEALTH_RESPONSE"
        
        # Test registration endpoint
        print_info "Testing API endpoints..."
        REGISTER_TEST=$(curl -s -X POST http://localhost:8000/auth/register \
            -H "Content-Type: application/json" \
            -d '{"name":"Test","email":"test@test.com","password":"test12345"}' 2>&1)
        if echo "$REGISTER_TEST" | grep -q "already registered\|successfully\|Field required"; then
            print_success "Registration endpoint is working"
        else
            print_warning "Registration endpoint test inconclusive"
        fi
    else
        print_warning "Backend is running but API not responding"
        print_info "Check logs: sudo journalctl -u botaxxx-backend -n 50"
        print_info "Check error log: sudo tail -50 /var/log/botaxxx/backend.error.log"
    fi
else
    print_error "Backend service is not running!"
    print_info "Check logs: sudo journalctl -u botaxxx-backend -n 50"
    print_info "Check error log: sudo tail -50 /var/log/botaxxx/backend.error.log"
    print_info "Common fixes:"
    print_info "1. Check bcrypt version: cd $APP_DIR/backend && source venv/bin/activate && pip install 'bcrypt<4.0.0'"
    print_info "2. Check email-validator: cd $APP_DIR/backend && source venv/bin/activate && pip install email-validator"
    print_info "3. Check database connection: verify DATABASE_URL in backend/.env"
    print_info "4. Check migrations: cd $APP_DIR/backend && source venv/bin/activate && alembic upgrade head"
fi

# Check bot
if systemctl is-active --quiet botaxxx-bot; then
    print_success "Bot service is running"
else
    print_warning "Bot service is not running"
    if [ -z "$TELEGRAM_TOKEN" ] || [ "$TELEGRAM_TOKEN" = "your-telegram-bot-token-here" ]; then
        print_info "  Reason: Telegram token not set. Edit bot/.env and restart: sudo systemctl restart botaxxx-bot"
    else
        print_info "  Check logs: sudo journalctl -u botaxxx-bot -n 50"
        print_info "  Check error log: sudo tail -50 /var/log/botaxxx/bot.error.log"
    fi
fi

# Check nginx
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_warning "Nginx is not running"
fi

# Summary
echo ""
print_success "=========================================="
print_success "Installation completed!"
print_success "=========================================="
echo ""
print_info "Deployment information saved to: $APP_DIR/deployment_info.txt"
echo ""
print_info "Next steps:"
echo "  1. Check deployment info: cat $APP_DIR/deployment_info.txt"
echo "     Database password: $DB_PASSWORD"
echo ""
if [ -z "$TELEGRAM_TOKEN" ] || [ "$TELEGRAM_TOKEN" = "your-telegram-bot-token-here" ]; then
    echo "  2. ⚠️  IMPORTANT: Edit $APP_DIR/bot/.env and add your TELEGRAM_BOT_TOKEN"
    echo "     Then restart bot: sudo systemctl restart botaxxx-bot"
else
    echo "  2. ✅ Telegram token already set"
fi
echo ""
echo "  3. Register user:"
if [[ $DOMAIN == *":"* ]]; then
    echo "     - Via dashboard: http://[$DOMAIN]/register"
    echo "     - Or use IPv4: http://$(curl -s -4 ifconfig.me 2>/dev/null || echo 'YOUR_IPV4')/register"
else
    echo "     - Via dashboard: http://$DOMAIN/register"
fi
echo "     - Via API: curl -X POST http://localhost:8000/auth/register \\"
echo "                -H 'Content-Type: application/json' \\"
echo "                -d '{\"name\":\"Your Name\",\"email\":\"your@email.com\",\"password\":\"yourpassword\"}'"
echo ""
echo "  4. Set Telegram ID:"
echo "     - Login to dashboard and go to Profile settings"
echo "     - Or via API after login: curl -X PUT http://localhost:8000/users/profile \\"
echo "                              -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "                              -H 'Content-Type: application/json' \\"
echo "                              -d '{\"telegram_id\":\"YOUR_TELEGRAM_ID\"}'"
echo ""
echo "  5. Test bot: Send /start to your bot in Telegram"
echo ""
print_info "Troubleshooting:"
echo "  - Backend logs: sudo journalctl -u botaxxx-backend -f"
echo "  - Bot logs: sudo journalctl -u botaxxx-bot -f"
echo "  - Backend error log: sudo tail -f /var/log/botaxxx/backend.error.log"
echo "  - Bot error log: sudo tail -f /var/log/botaxxx/bot.error.log"
echo "  - If bot gets 404, restart backend: sudo systemctl restart botaxxx-backend"
echo "  - If you see 'bcrypt version' errors: cd $APP_DIR/backend && source venv/bin/activate && pip install 'bcrypt<4.0.0' && sudo systemctl restart botaxxx-backend"
echo ""
print_info "Access URLs:"
if [[ $DOMAIN == *":"* ]]; then
    IPV4_ADDR=$(curl -s -4 ifconfig.me 2>/dev/null || echo '')
    echo "  IPv6 (use brackets in browser):"
    echo "    Frontend: http://[$DOMAIN]"
    echo "    API: http://[$API_DOMAIN]"
    echo "    API Docs: http://[$API_DOMAIN]/docs"
    echo "    Health: http://[$API_DOMAIN]/health"
    if [ ! -z "$IPV4_ADDR" ]; then
        echo ""
        echo "  IPv4 (RECOMMENDED - easier to access):"
        echo "    Frontend: http://$IPV4_ADDR"
        echo "    API: http://$IPV4_ADDR"
        echo "    API Docs: http://$IPV4_ADDR/docs"
        echo "    Health: http://$IPV4_ADDR/health"
    fi
    echo ""
    echo "  Note: If IPv6 doesn't work, use IPv4 address above"
else
    echo "  Frontend: http://$DOMAIN"
    echo "  API: http://$API_DOMAIN"
    echo "  API Docs: http://$API_DOMAIN/docs"
    echo "  Health: http://$API_DOMAIN/health"
fi
echo ""
if [ -z "$SSL_EMAIL" ]; then
    print_warning "SSL not configured. To setup SSL later: sudo certbot --nginx"
fi
echo ""

