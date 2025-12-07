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

# Start backend first
print_info "Starting backend service..."
systemctl start botaxxx-backend || print_error "Failed to start backend"

# Wait for backend to be ready
print_info "Waiting for backend to be ready..."
sleep 5
BACKEND_READY=false
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend is ready!"
        BACKEND_READY=true
        break
    fi
    if [ $i -lt 30 ]; then
        sleep 2
    fi
done

if [ "$BACKEND_READY" = false ]; then
    print_error "Backend failed to start or is not responding!"
    print_info "Check backend logs: sudo journalctl -u botaxxx-backend -n 50"
    print_info "Check error log: sudo tail -50 /var/log/botaxxx/backend.error.log"
    print_warning "Continuing with installation, but backend may need manual fixing"
fi

# Start bot (only if backend is ready and Telegram token is set)
if [ "$BACKEND_READY" = true ]; then
    if [ ! -z "$TELEGRAM_TOKEN" ] && [ "$TELEGRAM_TOKEN" != "your-telegram-bot-token-here" ]; then
        print_info "Starting bot service..."
        if systemctl start botaxxx-bot; then
            print_success "Bot service started"
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
fi

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
    print_info "1. Check email-validator: cd $APP_DIR/backend && source venv/bin/activate && pip install email-validator"
    print_info "2. Check database connection: verify DATABASE_URL in backend/.env"
    print_info "3. Check migrations: cd $APP_DIR/backend && source venv/bin/activate && alembic upgrade head"
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
echo "     - Via dashboard: http://$DOMAIN/register"
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
echo ""
print_info "Access URLs:"
echo "  Frontend: http://$DOMAIN"
echo "  API: http://$API_DOMAIN"
echo "  API Docs: http://$API_DOMAIN/docs"
echo "  Health: http://$API_DOMAIN/health"
echo ""
if [ -z "$SSL_EMAIL" ]; then
    print_warning "SSL not configured. To setup SSL later: sudo certbot --nginx"
fi
echo ""

