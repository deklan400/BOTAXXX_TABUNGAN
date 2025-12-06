# 🚀 Panduan Deploy BOTAXXX ke VPS (0-100%)

Panduan lengkap untuk deploy BOTAXXX Financial Command Center ke VPS dari awal sampai production-ready.

## 📋 Prerequisites

- VPS dengan Ubuntu 20.04/22.04 atau Debian 11/12
- Root access atau user dengan sudo privileges
- Domain name (opsional, untuk SSL)
- Telegram Bot Token dari @BotFather

## 🎯 Step-by-Step Setup

### Step 1: Initial VPS Setup

#### 1.1 Login ke VPS

```bash
ssh root@your-vps-ip
# atau
ssh your-user@your-vps-ip
```

#### 1.2 Update System

```bash
sudo apt update
sudo apt upgrade -y
```

#### 1.3 Install Essential Tools

```bash
sudo apt install -y curl wget git build-essential software-properties-common
```

#### 1.4 Setup Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

### Step 2: Install Dependencies

#### 2.1 Install Python 3.11

```bash
# Add deadsnakes PPA for Python 3.11
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# Install pip
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

# Verify
python3.11 --version
pip3.11 --version
```

#### 2.2 Install Node.js 18+

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

#### 2.3 Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE botaxxx_db;
CREATE USER botaxxx WITH PASSWORD 'your_secure_password_here';
ALTER ROLE botaxxx SET client_encoding TO 'utf8';
ALTER ROLE botaxxx SET default_transaction_isolation TO 'read committed';
ALTER ROLE botaxxx SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE botaxxx_db TO botaxxx;
\q
EOF

# Verify
sudo systemctl status postgresql
```

#### 2.4 Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify
sudo systemctl status nginx
```

#### 2.5 Install Certbot (for SSL)

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

### Step 3: Clone Repository

#### 3.1 Create Application Directory

```bash
sudo mkdir -p /var/www/botaxxx
sudo chown $USER:$USER /var/www/botaxxx
cd /var/www/botaxxx
```

#### 3.2 Clone Repository

```bash
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git .
# atau jika sudah ada, pull latest
git pull origin main
```

---

### Step 4: Setup Backend

#### 4.1 Create Virtual Environment

```bash
cd /var/www/botaxxx/backend
python3.11 -m venv venv
source venv/bin/activate
```

#### 4.2 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 4.3 Create Environment File

```bash
nano .env
```

Isi dengan:

```env
# Database
DATABASE_URL=postgresql://botaxxx:your_secure_password_here@localhost:5432/botaxxx_db

# Security
SECRET_KEY=your-very-secure-secret-key-minimum-32-characters-long-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60
```

**Generate SECRET_KEY:**
```bash
python3.11 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 4.4 Run Database Migrations

```bash
source venv/bin/activate
alembic upgrade head
```

#### 4.5 Test Backend

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
# Test di browser: http://your-vps-ip:8000/docs
# Tekan Ctrl+C untuk stop
```

---

### Step 5: Setup Frontend

#### 5.1 Install Dependencies

```bash
cd /var/www/botaxxx/dashboard
npm install
```

#### 5.2 Create Environment File

```bash
nano .env
```

Isi dengan:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
# atau jika sama domain
VITE_API_BASE_URL=https://yourdomain.com/api
```

#### 5.3 Build Frontend

```bash
npm run build
```

Build output akan ada di `dist/` directory.

---

### Step 6: Setup Telegram Bot

#### 6.1 Create Virtual Environment

```bash
cd /var/www/botaxxx/bot
python3.11 -m venv venv
source venv/bin/activate
```

#### 6.2 Install Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 6.3 Create Environment File

```bash
nano .env
```

Isi dengan:

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-from-botfather

# API Configuration
API_BASE_URL=https://api.yourdomain.com
# atau jika sama domain
API_BASE_URL=https://yourdomain.com
```

---

### Step 7: Setup Systemd Services

#### 7.1 Create Backend Service

```bash
sudo nano /etc/systemd/system/botaxxx-backend.service
```

Isi dengan:

```ini
[Unit]
Description=BOTAXXX Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/botaxxx/backend
Environment="PATH=/var/www/botaxxx/backend/venv/bin"
ExecStart=/var/www/botaxxx/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 7.2 Create Bot Service

```bash
sudo nano /etc/systemd/system/botaxxx-bot.service
```

Isi dengan:

```ini
[Unit]
Description=BOTAXXX Telegram Bot
After=network.target botaxxx-backend.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/botaxxx/bot
Environment="PATH=/var/www/botaxxx/bot/venv/bin"
ExecStart=/var/www/botaxxx/bot/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### 7.3 Enable and Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable botaxxx-backend
sudo systemctl enable botaxxx-bot

# Start services
sudo systemctl start botaxxx-backend
sudo systemctl start botaxxx-bot

# Check status
sudo systemctl status botaxxx-backend
sudo systemctl status botaxxx-bot
```

---

### Step 8: Setup Nginx Reverse Proxy

#### 8.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/botaxxx
```

Isi dengan (untuk single domain):

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;  # atau yourdomain.com

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend Dashboard
server {
    listen 80;
    server_name yourdomain.com;  # atau www.yourdomain.com

    root /var/www/botaxxx/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (jika frontend dan backend di domain yang sama)
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Atau untuk subdomain terpisah:

```nginx
# Backend API - api.yourdomain.com
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Frontend Dashboard - yourdomain.com
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/botaxxx/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 8.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/botaxxx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 9: Setup SSL dengan Let's Encrypt

#### 9.1 Get SSL Certificate

```bash
# Untuk single domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Untuk subdomain terpisah
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

Certbot akan otomatis:
- Generate SSL certificate
- Update Nginx configuration
- Setup auto-renewal

#### 9.2 Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

---

### Step 10: Setup Logging

#### 10.1 Create Log Directories

```bash
sudo mkdir -p /var/log/botaxxx
sudo chown www-data:www-data /var/log/botaxxx
```

#### 10.2 Update Backend Service untuk Logging

Edit `/etc/systemd/system/botaxxx-backend.service`:

```ini
[Unit]
Description=BOTAXXX Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/botaxxx/backend
Environment="PATH=/var/www/botaxxx/backend/venv/bin"
ExecStart=/var/www/botaxxx/backend/venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=10
StandardOutput=append:/var/log/botaxxx/backend.log
StandardError=append:/var/log/botaxxx/backend.error.log

[Install]
WantedBy=multi-user.target
```

#### 10.3 Update Bot Service untuk Logging

Edit `/etc/systemd/system/botaxxx-bot.service`:

```ini
[Unit]
Description=BOTAXXX Telegram Bot
After=network.target botaxxx-backend.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/botaxxx/bot
Environment="PATH=/var/www/botaxxx/bot/venv/bin"
ExecStart=/var/www/botaxxx/bot/venv/bin/python main.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/botaxxx/bot.log
StandardError=append:/var/log/botaxxx/bot.error.log

[Install]
WantedBy=multi-user.target
```

#### 10.4 Reload Services

```bash
sudo systemctl daemon-reload
sudo systemctl restart botaxxx-backend
sudo systemctl restart botaxxx-bot
```

---

### Step 11: Security Hardening

#### 11.1 Setup Fail2Ban

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

#### 11.2 Disable Root Login (Recommended)

```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

#### 11.3 Setup Automatic Security Updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

#### 11.4 Setup Firewall Rules

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

### Step 12: Monitoring & Maintenance

#### 12.1 Check Service Status

```bash
# Check all services
sudo systemctl status botaxxx-backend
sudo systemctl status botaxxx-bot
sudo systemctl status nginx
sudo systemctl status postgresql

# Check logs
sudo journalctl -u botaxxx-backend -f
sudo journalctl -u botaxxx-bot -f
tail -f /var/log/botaxxx/backend.log
tail -f /var/log/botaxxx/bot.log
```

#### 12.2 Setup Log Rotation

```bash
sudo nano /etc/logrotate.d/botaxxx
```

Isi dengan:

```
/var/log/botaxxx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

---

### Step 13: Update & Maintenance Commands

#### 13.1 Update Application

```bash
cd /var/www/botaxxx
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart botaxxx-backend

# Frontend
cd ../dashboard
npm install
npm run build
sudo systemctl reload nginx

# Bot
cd ../bot
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart botaxxx-bot
```

#### 13.2 Backup Database

```bash
# Create backup script
sudo nano /usr/local/bin/backup-botaxxx.sh
```

Isi dengan:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/botaxxx"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U botaxxx botaxxx_db > $BACKUP_DIR/botaxxx_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

```bash
sudo chmod +x /usr/local/bin/backup-botaxxx.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-botaxxx.sh
```

---

## ✅ Verification Checklist

- [ ] Backend API accessible at `https://api.yourdomain.com/docs`
- [ ] Frontend accessible at `https://yourdomain.com`
- [ ] Database connection working
- [ ] SSL certificate installed and auto-renewal working
- [ ] Systemd services running and auto-start on boot
- [ ] Logs are being written
- [ ] Telegram bot responding to /start
- [ ] Firewall configured correctly
- [ ] Backups configured
- [ ] Security updates enabled

---

## 🔧 Troubleshooting

### Backend tidak jalan

```bash
# Check logs
sudo journalctl -u botaxxx-backend -n 50
tail -f /var/log/botaxxx/backend.error.log

# Check service status
sudo systemctl status botaxxx-backend

# Test manual
cd /var/www/botaxxx/backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Bot tidak jalan

```bash
# Check logs
sudo journalctl -u botaxxx-bot -n 50
tail -f /var/log/botaxxx/bot.error.log

# Check .env file
cat /var/www/botaxxx/bot/.env

# Test manual
cd /var/www/botaxxx/bot
source venv/bin/activate
python main.py
```

### Nginx error

```bash
# Check configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Reload nginx
sudo systemctl reload nginx
```

### Database connection error

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U botaxxx -d botaxxx_db -h localhost

# Check database exists
sudo -u postgres psql -l
```

---

## 📚 Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Systemd Service Documentation](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

## 🎉 Congratulations!

BOTAXXX Financial Command Center sudah berjalan di VPS Anda!

**Access URLs:**
- Frontend: `https://yourdomain.com`
- API Docs: `https://api.yourdomain.com/docs`
- Health Check: `https://api.yourdomain.com/health`

**Next Steps:**
1. Test semua fitur di dashboard
2. Test Telegram bot
3. Setup monitoring (opsional: Prometheus, Grafana)
4. Setup alerts untuk downtime
5. Regular backups verification

