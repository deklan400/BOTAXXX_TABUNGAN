#!/bin/bash

# BOTAXXX - VPS Deployment Script
# Automated deployment script for VPS setup
# Run with: sudo bash deploy-vps.sh

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
DOMAIN=""
API_DOMAIN=""

# Get domain from user
read -p "Enter your domain name (e.g., example.com): " DOMAIN
read -p "Enter API subdomain (e.g., api.example.com) or press Enter to use same domain: " API_DOMAIN

if [ -z "$API_DOMAIN" ]; then
    API_DOMAIN="$DOMAIN"
fi

print_info "Starting deployment for domain: $DOMAIN"
print_info "API domain: $API_DOMAIN"

# Step 1: Update system
print_info "Step 1: Updating system..."
apt update
apt upgrade -y
apt install -y curl wget git build-essential software-properties-common ufw

# Step 2: Setup firewall
print_info "Step 2: Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Step 3: Install Python 3.11
print_info "Step 3: Installing Python 3.11..."
add-apt-repository ppa:deadsnakes/ppa -y
apt update
apt install -y python3.11 python3.11-venv python3.11-dev
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

# Step 4: Install Node.js
print_info "Step 4: Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Step 5: Install PostgreSQL
print_info "Step 5: Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Generate random password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

# Create database and user
print_info "Creating database and user..."
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
ALTER ROLE $DB_USER SET client_encoding TO 'utf8';
ALTER ROLE $DB_USER SET default_transaction_isolation TO 'read committed';
ALTER ROLE $DB_USER SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\q
EOF

print_success "Database created. Password saved to: $APP_DIR/db_password.txt"

# Step 6: Install Nginx
print_info "Step 6: Installing Nginx..."
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# Step 7: Install Certbot
print_info "Step 7: Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Step 8: Create application directory
print_info "Step 8: Creating application directory..."
mkdir -p $APP_DIR
chown $APP_USER:$APP_USER $APP_DIR

# Step 9: Clone repository (if not exists)
if [ ! -d "$APP_DIR/.git" ]; then
    print_info "Step 9: Cloning repository..."
    cd $APP_DIR
    git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git .
    chown -R $APP_USER:$APP_USER $APP_DIR
else
    print_info "Step 9: Repository already exists, pulling latest..."
    cd $APP_DIR
    git pull origin main
    chown -R $APP_USER:$APP_USER $APP_DIR
fi

# Step 10: Setup Backend
print_info "Step 10: Setting up backend..."
cd $APP_DIR/backend
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip (handle Debian pip issue)
print_info "Upgrading pip..."
python3.11 -m pip install --upgrade pip --break-system-packages 2>/dev/null || \
python3.11 -m pip install --upgrade pip --user 2>/dev/null || \
print_warning "Skipping pip upgrade, using existing version"

# Install requirements
print_info "Installing backend dependencies..."
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
alembic upgrade head

# Step 11: Setup Frontend
print_info "Step 11: Setting up frontend..."
cd $APP_DIR/dashboard
npm install

# Create .env file
cat > .env << EOF
VITE_API_BASE_URL=https://$API_DOMAIN
EOF

# Build frontend
print_info "Building frontend..."
npm run build

# Step 12: Setup Bot
print_info "Step 12: Setting up bot..."
cd $APP_DIR/bot
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip (handle Debian pip issue)
print_info "Upgrading pip..."
python3.11 -m pip install --upgrade pip --break-system-packages 2>/dev/null || \
python3.11 -m pip install --upgrade pip --user 2>/dev/null || \
print_warning "Skipping pip upgrade, using existing version"

# Install requirements
print_info "Installing bot dependencies..."
pip install -r requirements.txt

# Create .env file (user needs to add TELEGRAM_BOT_TOKEN)
cat > .env << EOF
# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# API Configuration
API_BASE_URL=https://$API_DOMAIN
EOF

chown $APP_USER:$APP_USER .env

# Step 13: Create systemd services
print_info "Step 13: Creating systemd services..."

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

# Create log directory
mkdir -p /var/log/botaxxx
chown $APP_USER:$APP_USER /var/log/botaxxx

# Step 14: Setup Nginx
print_info "Step 14: Setting up Nginx..."

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
nginx -t
systemctl reload nginx

# Step 15: Setup SSL
print_info "Step 15: Setting up SSL certificate..."
print_warning "Make sure your domain DNS points to this server IP!"
read -p "Press Enter to continue with SSL setup..."

if [ "$API_DOMAIN" = "$DOMAIN" ]; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
else
    certbot --nginx -d $DOMAIN -d www.$DOMAIN -d $API_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
fi

# Step 16: Enable and start services
print_info "Step 16: Starting services..."
systemctl daemon-reload
systemctl enable botaxxx-backend
systemctl enable botaxxx-bot
systemctl start botaxxx-backend
systemctl start botaxxx-bot

# Step 17: Save credentials
print_info "Step 17: Saving credentials..."
mkdir -p $APP_DIR
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
1. Edit $APP_DIR/bot/.env and add your TELEGRAM_BOT_TOKEN
2. Restart bot service: systemctl restart botaxxx-bot
3. Check service status: systemctl status botaxxx-backend botaxxx-bot
4. View logs: journalctl -u botaxxx-backend -f

Access URLs:
- Frontend: https://$DOMAIN
- API: https://$API_DOMAIN
- API Docs: https://$API_DOMAIN/docs
EOF

chmod 600 $APP_DIR/deployment_info.txt
chown $APP_USER:$APP_USER $APP_DIR/deployment_info.txt

print_success "Deployment completed!"
print_info "Credentials saved to: $APP_DIR/deployment_info.txt"
print_warning "IMPORTANT: Edit $APP_DIR/bot/.env and add your TELEGRAM_BOT_TOKEN"
print_warning "Then restart bot: systemctl restart botaxxx-bot"

echo ""
print_success "Access your application:"
echo "  Frontend: https://$DOMAIN"
echo "  API Docs: https://$API_DOMAIN/docs"
echo ""

