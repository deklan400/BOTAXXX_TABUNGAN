# 🚀 Setup BOTAXXX - Panduan Lengkap

## 📋 Daftar Isi
1. [Prerequisites](#prerequisites)
2. [Setup VPS dari Awal](#setup-vps-dari-awal)
3. [Setup Database](#setup-database)
4. [Setup Backend](#setup-backend)
5. [Setup Bot](#setup-bot)
6. [Setup Dashboard](#setup-dashboard)
7. [Setup Systemd Services](#setup-systemd-services)
8. [Setup Nginx](#setup-nginx)
9. [Setup Google OAuth (Optional)](#setup-google-oauth-optional)
10. [Verifikasi Setup](#verifikasi-setup)

---

## Prerequisites

- VPS dengan Ubuntu/Debian
- Root atau sudo access
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Telegram Bot Token (dari @BotFather)

---

## Setup VPS dari Awal

### Step 1: Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### Step 2: Install Dependencies
```bash
# Python dan pip
sudo apt install python3.11 python3.11-venv python3-pip -y

# Node.js dan npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Nginx
sudo apt install nginx -y

# Git
sudo apt install git -y
```

### Step 3: Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git botaxxx
cd botaxxx
```

---

## Setup Database

### Step 1: Buat Database dan User
```bash
sudo -u postgres psql << EOF
CREATE DATABASE botaxxx_db;
CREATE USER botaxxx WITH PASSWORD 'botaxxx_password';
GRANT ALL PRIVILEGES ON DATABASE botaxxx_db TO botaxxx;
ALTER USER botaxxx CREATEDB;
\q
EOF
```

### Step 2: Test Connection
```bash
sudo -u postgres psql -d botaxxx_db -c "SELECT 1;"
```

---

## Setup Backend

### Step 1: Buat Virtual Environment
```bash
cd /var/www/botaxxx/backend
python3.11 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt

# Fix bcrypt version (jika error)
pip install "bcrypt<4.0.0"
```

### Step 3: Buat .env File
```bash
nano .env
```

**Isi .env:**
```bash
# Security
SECRET_KEY=your-secret-key-min-32-characters-long-random-string-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Database
DATABASE_URL=postgresql://botaxxx:botaxxx_password@localhost:5432/botaxxx_db

# CORS
CORS_ORIGINS=http://YOUR_IP,http://YOUR_DOMAIN

# Frontend
FRONTEND_URL=http://YOUR_IP

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://YOUR_IP:8000/auth/google/callback
```

**PENTING:** Ganti `YOUR_IP` dengan IP VPS Anda (contoh: `159.195.13.157`)

### Step 4: Run Migrations
```bash
source venv/bin/activate
alembic upgrade head
```

### Step 5: Test Imports
```bash
python3.11 test_imports.py
```

---

## Setup Bot

### Step 1: Buat Virtual Environment
```bash
cd /var/www/botaxxx/bot
python3.11 -m venv venv
source venv/bin/activate
```

### Step 2: Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3: Buat .env File
```bash
nano .env
```

**Isi .env:**
```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_from_botfather
API_BASE_URL=http://localhost:8000
```

**Cara dapatkan Telegram Bot Token:**
1. Buka Telegram, cari @BotFather
2. Kirim `/newbot`
3. Ikuti instruksi
4. Copy token yang diberikan

### Step 4: Setup Data Directory
```bash
sudo mkdir -p /var/www/botaxxx/bot/data
sudo chown www-data:www-data /var/www/botaxxx/bot/data
sudo chmod 755 /var/www/botaxxx/bot/data
sudo -u www-data touch /var/www/botaxxx/bot/data/user_states.json
sudo -u www-data echo '{}' > /var/www/botaxxx/bot/data/user_states.json
sudo chmod 644 /var/www/botaxxx/bot/data/user_states.json
```

---

## Setup Dashboard

### Step 1: Install Dependencies
```bash
cd /var/www/botaxxx/dashboard
npm install
```

### Step 2: Build Production
```bash
npm run build
```

### Step 3: (Optional) Buat .env File
```bash
nano .env
```

**Isi .env (optional):**
```bash
VITE_API_BASE_URL=http://YOUR_IP:8000
```

---

## Setup Systemd Services

### Step 1: Buat Log Directory
```bash
sudo mkdir -p /var/log/botaxxx
sudo chown www-data:www-data /var/log/botaxxx
```

### Step 2: Backend Service
```bash
sudo nano /etc/systemd/system/botaxxx-backend.service
```

**Isi file:**
```ini
[Unit]
Description=BOTAXXX Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
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

### Step 3: Bot Service
```bash
sudo nano /etc/systemd/system/botaxxx-bot.service
```

**Isi file:**
```ini
[Unit]
Description=BOTAXXX Telegram Bot
After=network.target botaxxx-backend.service

[Service]
Type=simple
User=www-data
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

### Step 4: Enable dan Start Services
```bash
sudo systemctl daemon-reload
sudo systemctl enable botaxxx-backend botaxxx-bot
sudo systemctl start botaxxx-backend botaxxx-bot
```

### Step 5: Set Permissions
```bash
sudo chown -R www-data:www-data /var/www/botaxxx
sudo chmod -R 755 /var/www/botaxxx
```

---

## Setup Nginx

### Step 1: Buat Nginx Config
```bash
sudo nano /etc/nginx/sites-available/botaxxx
```

**Isi file:**
```nginx
server {
    listen 80;
    server_name YOUR_IP_OR_DOMAIN;

    # Dashboard
    location / {
        root /var/www/botaxxx/dashboard/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Direct backend access (for OAuth callbacks)
    location ~ ^/(auth|users|overview|savings|loans|targets|banks|health|docs) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 2: Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/botaxxx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Setup Google OAuth (Optional)

### Step 1: Buat Google OAuth Credentials

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru atau pilih existing
3. Enable APIs:
   - Go to "APIs & Services" > "Library"
   - Search "Google+ API" → Enable
4. Configure OAuth Consent Screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - User Type: **External**
   - App name: **BOTAXXX**
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (email Anda)
5. Create OAuth 2.0 Client ID:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Web application**
   - Authorized redirect URIs:
     ```
     http://YOUR_IP:8000/auth/google/callback
     ```
   - Copy **Client ID** dan **Client Secret**

### Step 2: Update Backend .env
```bash
cd /var/www/botaxxx/backend
nano .env
```

Tambahkan:
```bash
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here
GOOGLE_REDIRECT_URI=http://YOUR_IP:8000/auth/google/callback
```

### Step 3: Restart Backend
```bash
sudo systemctl restart botaxxx-backend
```

**Note:** Google OAuth **GRATIS 100%**, tidak perlu kartu kredit atau prabayar.

---

## Verifikasi Setup

### Check Backend
```bash
# Check service status
sudo systemctl status botaxxx-backend

# Check logs
sudo tail -50 /var/log/botaxxx/backend.log

# Test API
curl http://localhost:8000/health
# Should return: {"status":"healthy","database":"connected","version":"1.0.0"}
```

### Check Bot
```bash
# Check service status
sudo systemctl status botaxxx-bot

# Check logs
sudo tail -50 /var/log/botaxxx/bot.log

# Test bot di Telegram: kirim /start
```

### Check Dashboard
```bash
# Check nginx
sudo systemctl status nginx

# Test dashboard
curl http://YOUR_IP
# Should return HTML
```

### Check Database
```bash
# Test connection
sudo -u postgres psql -d botaxxx_db -c "SELECT COUNT(*) FROM users;"
```

---

## Update Aplikasi

```bash
# Backend
cd /var/www/botaxxx/backend
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart botaxxx-backend

# Bot
cd /var/www/botaxxx/bot
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart botaxxx-bot

# Dashboard
cd /var/www/botaxxx/dashboard
git pull origin main
npm install
npm run build
sudo systemctl reload nginx
```

---

## Quick Commands

```bash
# Restart semua services
sudo systemctl restart botaxxx-backend botaxxx-bot nginx

# Check semua status
sudo systemctl status botaxxx-backend botaxxx-bot nginx postgresql

# View semua logs
sudo tail -50 /var/log/botaxxx/*.log

# Update semua dari git
cd /var/www/botaxxx && git pull origin main
```

---

## Next Steps

Setelah setup selesai, lihat [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) jika ada masalah.

