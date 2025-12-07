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

# Get user inputs
echo ""
print_info "=== BOTAXXX VPS Installation ==="
echo ""
read -p "Enter your domain name (e.g., example.com) or press Enter to use IP: " DOMAIN
read -p "Enter API subdomain (e.g., api.example.com) or press Enter to use same domain: " API_DOMAIN
read -p "Enter email for SSL certificate (optional, press Enter to skip SSL): " SSL_EMAIL
read -p "Enter Telegram Bot Token from @BotFather (optional, can add later): " TELEGRAM_TOKEN

if [ -z "$DOMAIN" ]; then
    DOMAIN=$(curl -s ifconfig.me)
    print_warning "Using VPS IP: $DOMAIN"
fi

if [ -z "$API_DOMAIN" ]; then
    API_DOMAIN="$DOMAIN"
fi

print_info "Starting installation for domain: $DOMAIN"
print_info "API domain: $API_DOMAIN"
echo ""

# Step 1: Update system
print_info "Step 1/13: Updating system..."
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
fi

# Check if user exists
USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_user WHERE usename='$DB_USER'")
if [ "$USER_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
else
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
fi

# Set privileges
sudo -u postgres psql << EOF
ALTER ROLE $DB_USER SET client_encoding TO 'utf8';
ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';
ALTER ROLE $DB_USER SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
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
    git pull origin main || print_warning "Git pull failed, continuing..."
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

# Generate SECRET_KEY
SECRET_KEY=$(python3.11 -c "import secrets; print(secrets.token_urlsafe(32))")

# Create .env file
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

# CORS
CORS_ORIGINS=https://$DOMAIN,https://www.$DOMAIN
FRONTEND_URL=https://$DOMAIN

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60
EOF

chown $APP_USER:$APP_USER .env

# Run migrations
print_info "Running database migrations..."
source venv/bin/activate
alembic upgrade head || print_warning "Migrations may have failed, check manually"

# Step 11: Setup Frontend
print_info "Step 11/13: Setting up frontend..."
cd $APP_DIR/dashboard
npm install

# Create .env file
cat > .env << EOF
VITE_API_BASE_URL=https://$API_DOMAIN
EOF

# Build frontend
print_info "Building frontend..."
npm run build || print_error "Frontend build failed, check manually"

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

# Create .env file
cat > .env << EOF
# Telegram Bot
TELEGRAM_BOT_TOKEN=${TELEGRAM_TOKEN:-your-telegram-bot-token-here}

# API Configuration
API_BASE_URL=https://$API_DOMAIN
EOF

chown $APP_USER:$APP_USER .env

# Step 13: Create systemd services
print_info "Step 13/13: Creating systemd services..."

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
systemctl start botaxxx-backend botaxxx-bot || print_warning "Failed to start services"

# Step 14: Setup Nginx
print_info "Setting up Nginx..."

# Create Nginx config
cat > /etc/nginx/sites-available/botaxxx << EOF
# Backend API
server {
    listen 80;
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
    server_name $DOMAIN www.$DOMAIN;

    root $APP_DIR/dashboard/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/botaxxx /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
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

# Step 17: Save credentials
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

Important:
1. Edit $APP_DIR/bot/.env and add your TELEGRAM_BOT_TOKEN if not set
2. Restart bot service: systemctl restart botaxxx-bot
3. Check service status: systemctl status botaxxx-backend botaxxx-bot
4. View logs: journalctl -u botaxxx-backend -f

Access URLs:
- Frontend: http://$DOMAIN (or https:// if SSL configured)
- API: http://$API_DOMAIN (or https:// if SSL configured)
- API Docs: http://$API_DOMAIN/docs
EOF

chmod 600 $APP_DIR/deployment_info.txt
chown $APP_USER:$APP_USER $APP_DIR/deployment_info.txt

# Final verification
print_info "Verifying services..."
sleep 3

if systemctl is-active --quiet botaxxx-backend; then
    print_success "Backend service is running"
else
    print_warning "Backend service is not running. Check logs: journalctl -u botaxxx-backend"
fi

if systemctl is-active --quiet botaxxx-bot; then
    print_success "Bot service is running"
else
    print_warning "Bot service is not running. Check logs: journalctl -u botaxxx-bot"
fi

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
echo "  2. If Telegram token not set, edit: $APP_DIR/bot/.env"
echo "  3. Restart bot: systemctl restart botaxxx-bot"
echo "  4. Check services: systemctl status botaxxx-backend botaxxx-bot nginx"
echo "  5. View logs: journalctl -u botaxxx-backend -f"
echo ""
print_info "Access URLs:"
echo "  Frontend: http://$DOMAIN"
echo "  API: http://$API_DOMAIN"
echo "  API Docs: http://$API_DOMAIN/docs"
echo ""
print_warning "If you haven't set up SSL yet, run: sudo certbot --nginx"
echo ""

