# 🚀 Quick Start: Deploy BOTAXXX ke VPS

Panduan cepat deploy BOTAXXX ke VPS dalam 15 menit.

## 📋 Prerequisites

- VPS Ubuntu 20.04/22.04 atau Debian 11/12
- Root access
- Domain name (untuk SSL)
- Telegram Bot Token

---

## ⚡ Metode 1: Automated Script (Recommended)

### Langkah 1: Login ke VPS

```bash
ssh root@your-vps-ip
```

### Langkah 2: Download & Jalankan Script

```bash
# Download script
wget https://raw.githubusercontent.com/deklan400/BOTAXXX_TABUNGAN/main/deploy-vps.sh

# Atau clone repository
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git
cd BOTAXXX_TABUNGAN

# Jalankan script
chmod +x deploy-vps.sh
sudo bash deploy-vps.sh
```

Script akan meminta:
- Domain name (contoh: `example.com`)
- API subdomain (contoh: `api.example.com` atau kosongkan untuk sama)

**Script akan otomatis:**
- ✅ Install semua dependencies
- ✅ Setup database
- ✅ Setup backend, frontend, bot
- ✅ Setup systemd services
- ✅ Setup Nginx & SSL
- ✅ Start semua services

### Langkah 3: Setup Telegram Bot Token

```bash
# Edit bot .env
nano /var/www/botaxxx/bot/.env

# Tambahkan token dari @BotFather
TELEGRAM_BOT_TOKEN=your-actual-token-here

# Restart bot
sudo systemctl restart botaxxx-bot
```

### Langkah 4: Verifikasi

```bash
# Check semua services
sudo systemctl status botaxxx-backend
sudo systemctl status botaxxx-bot
sudo systemctl status nginx

# Test API
curl https://api.yourdomain.com/health
```

**Selesai!** Akses:
- Frontend: `https://yourdomain.com`
- API Docs: `https://api.yourdomain.com/docs`

---

## 🔧 Metode 2: Manual Setup (Step-by-Step)

### Step 1: Update System & Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl wget git build-essential

# Install Python 3.11
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Nginx
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Install Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx

# Setup Firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### Step 2: Setup Database

```bash
# Generate password
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "Database password: $DB_PASSWORD"  # Simpan password ini!

# Create database
sudo -u postgres psql << EOF
CREATE DATABASE botaxxx_db;
CREATE USER botaxxx WITH PASSWORD '$DB_PASSWORD';
ALTER ROLE botaxxx SET client_encoding TO 'utf8';
ALTER ROLE botaxxx SET default_transaction_isolation TO 'read committed';
ALTER ROLE botaxxx SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE botaxxx_db TO botaxxx;
\q
EOF
```

### Step 3: Clone & Setup Repository

```bash
# Create directory
sudo mkdir -p /var/www/botaxxx
sudo chown $USER:$USER /var/www/botaxxx
cd /var/www/botaxxx

# Clone repository
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git .

# Atau jika sudah ada, pull latest
git pull origin main
```

### Step 4: Setup Backend

```bash
cd /var/www/botaxxx/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Generate SECRET_KEY
SECRET_KEY=$(python3.11 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "SECRET_KEY: $SECRET_KEY"  # Simpan ini!

# Create .env file
nano .env
```

Isi `.env`:

```env
DATABASE_URL=postgresql://botaxxx:YOUR_DB_PASSWORD@localhost:5432/botaxxx_db
SECRET_KEY=YOUR_SECRET_KEY_HERE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60
```

```bash
# Run migrations
source venv/bin/activate
alembic upgrade head
```

### Step 5: Setup Frontend

```bash
cd /var/www/botaxxx/dashboard

# Install dependencies
npm install

# Create .env
echo "VITE_API_BASE_URL=https://api.yourdomain.com" > .env

# Build
npm run build
```

### Step 6: Setup Bot

```bash
cd /var/www/botaxxx/bot

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env
nano .env
```

Isi `.env`:

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-from-botfather
API_BASE_URL=https://api.yourdomain.com
```

### Step 7: Create Systemd Services

#### Backend Service

```bash
sudo nano /etc/systemd/system/botaxxx-backend.service
```

Isi:

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

#### Bot Service

```bash
sudo nano /etc/systemd/system/botaxxx-bot.service
```

Isi:

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

```bash
# Create log directory
sudo mkdir -p /var/log/botaxxx
sudo chown www-data:www-data /var/log/botaxxx

# Enable & start services
sudo systemctl daemon-reload
sudo systemctl enable botaxxx-backend botaxxx-bot
sudo systemctl start botaxxx-backend botaxxx-bot
```

### Step 8: Setup Nginx

```bash
sudo nano /etc/nginx/sites-available/botaxxx
```

Isi (ganti `yourdomain.com` dan `api.yourdomain.com`):

```nginx
# Backend API
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

# Frontend Dashboard
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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/botaxxx /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 9: Setup SSL

**PENTING:** Pastikan DNS domain sudah mengarah ke IP VPS!

```bash
# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Step 10: Set Permissions

```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/botaxxx
sudo chmod -R 755 /var/www/botaxxx
```

---

## ✅ Verification

```bash
# Check services
sudo systemctl status botaxxx-backend
sudo systemctl status botaxxx-bot
sudo systemctl status nginx

# Check logs
sudo journalctl -u botaxxx-backend -f
sudo journalctl -u botaxxx-bot -f

# Test API
curl https://api.yourdomain.com/health
```

---

## 🔧 Useful Commands

### View Logs

```bash
# Backend logs
sudo journalctl -u botaxxx-backend -n 50 -f

# Bot logs
sudo journalctl -u botaxxx-bot -n 50 -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Restart Services

```bash
sudo systemctl restart botaxxx-backend
sudo systemctl restart botaxxx-bot
sudo systemctl restart nginx
```

### Update Application

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

---

## 🐛 Troubleshooting

### Backend tidak jalan

```bash
# Check logs
sudo journalctl -u botaxxx-backend -n 50

# Check .env
cat /var/www/botaxxx/backend/.env

# Test manual
cd /var/www/botaxxx/backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Bot tidak jalan

```bash
# Check logs
sudo journalctl -u botaxxx-bot -n 50

# Check .env
cat /var/www/botaxxx/bot/.env

# Pastikan TELEGRAM_BOT_TOKEN sudah di-set
```

### Nginx error

```bash
# Test config
sudo nginx -t

# Check error log
sudo tail -f /var/log/nginx/error.log
```

### Database connection error

```bash
# Test connection
psql -U botaxxx -d botaxxx_db -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

---

## 📝 Checklist

- [ ] DNS domain mengarah ke IP VPS
- [ ] Semua dependencies terinstall
- [ ] Database dibuat dan user dibuat
- [ ] Backend .env file diisi dengan benar
- [ ] Frontend di-build
- [ ] Bot .env file diisi dengan TELEGRAM_BOT_TOKEN
- [ ] Systemd services dibuat dan enabled
- [ ] Nginx configured
- [ ] SSL certificate terpasang
- [ ] Semua services running
- [ ] Frontend accessible
- [ ] API accessible
- [ ] Bot responding

---

## 🎉 Selesai!

Akses aplikasi Anda:
- **Frontend:** `https://yourdomain.com`
- **API Docs:** `https://api.yourdomain.com/docs`
- **Health Check:** `https://api.yourdomain.com/health`

**Selamat!** BOTAXXX sudah berjalan di VPS Anda! 🚀

