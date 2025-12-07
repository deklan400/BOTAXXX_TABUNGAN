# 🚀 Panduan Setup Lengkap BOTAXXX dari 0 ke VPS

Panduan step-by-step untuk deploy BOTAXXX Financial Command Center ke VPS dari awal sampai production-ready.

---

## 📋 Daftar Isi

1. [Persiapan Awal](#1-persiapan-awal)
2. [Setup VPS](#2-setup-vps)
3. [Install Dependencies](#3-install-dependencies)
4. [Setup Database](#4-setup-database)
5. [Clone & Setup Repository](#5-clone--setup-repository)
6. [Setup Backend](#6-setup-backend)
7. [Setup Frontend](#7-setup-frontend)
8. [Setup Telegram Bot](#8-setup-telegram-bot)
9. [Setup Systemd Services](#9-setup-systemd-services)
10. [Setup Nginx Reverse Proxy](#10-setup-nginx-reverse-proxy)
11. [Setup SSL Certificate](#11-setup-ssl-certificate)
12. [Verifikasi & Testing](#12-verifikasi--testing)
13. [Maintenance & Update](#13-maintenance--update)

---

## 1. Persiapan Awal

### 1.1 Yang Diperlukan

Sebelum mulai, pastikan Anda sudah memiliki:

- ✅ **VPS** dengan Ubuntu 20.04/22.04 atau Debian 11/12
- ✅ **Root access** atau user dengan sudo privileges
- ✅ **Domain name** (opsional, untuk SSL)
- ✅ **Telegram Bot Token** dari [@BotFather](https://t.me/BotFather)
- ✅ **Akses SSH** ke VPS

### 1.2 Informasi yang Perlu Disiapkan

Catat informasi berikut sebelum mulai:

- IP Address VPS: `_________________`
- Domain name: `_________________`
- Telegram Bot Token: `_________________`
- Email untuk SSL: `_________________`

---

## 2. Setup VPS

### 2.1 Login ke VPS

```bash
# Login sebagai root
ssh root@your-vps-ip

# Atau jika menggunakan user biasa
ssh your-user@your-vps-ip
```

### 2.2 Update System

```bash
# Update package list
sudo apt update

# Upgrade semua package
sudo apt upgrade -y

# Install tools essential
sudo apt install -y curl wget git build-essential software-properties-common
```

### 2.3 Setup Firewall (UFW)

```bash
# Allow SSH (penting! jangan skip ini)
sudo ufw allow OpenSSH

# Allow HTTP dan HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**⚠️ PENTING:** Pastikan SSH sudah di-allow sebelum enable firewall, atau Anda bisa terkunci dari VPS!

---

## 3. Install Dependencies

### 3.1 Install Python 3.11

```bash
# Add deadsnakes PPA untuk Python 3.11
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update

# Install Python 3.11
sudo apt install -y python3.11 python3.11-venv python3.11-dev

# Install pip untuk Python 3.11
# Gunakan --break-system-packages untuk Debian/Ubuntu
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11 --break-system-packages

# Atau jika error, gunakan ensurepip
# python3.11 -m ensurepip --upgrade --break-system-packages

# Verify installation
python3.11 --version
pip3.11 --version
```

**Output yang diharapkan:**
```
Python 3.11.x
pip 23.x.x
```

**⚠️ Jika muncul error `uninstall-no-record-file`:**
Ini normal di Debian/Ubuntu. Pip sudah terinstall via package manager. Anda bisa:
- Skip upgrade pip (langsung install requirements di virtual environment)
- Atau gunakan `--break-system-packages` flag
- Lihat `FIX_PIP_ERROR.md` untuk solusi lengkap

### 3.2 Install Node.js 18+

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

**Output yang diharapkan:**
```
v18.x.x
9.x.x
```

### 3.3 Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start dan enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify status
sudo systemctl status postgresql
```

Tekan `q` untuk keluar dari status view.

### 3.4 Install Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start dan enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify status
sudo systemctl status nginx
```

### 3.5 Install Certbot (untuk SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx
```

---

## 4. Setup Database

### 4.1 Buat Database dan User

```bash
# Generate password yang aman
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "Database password: $DB_PASSWORD"
# ⚠️ SIMPAN PASSWORD INI! Anda akan membutuhkannya nanti.

# Create database dan user
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

**Catat password database Anda:**
```
Database Password: _________________
```

### 4.2 Test Koneksi Database

```bash
# Test koneksi (akan meminta password)
psql -U botaxxx -d botaxxx_db -h localhost
```

Jika berhasil, Anda akan masuk ke PostgreSQL prompt. Ketik `\q` untuk keluar.

---

## 5. Clone & Setup Repository

### 5.1 Buat Directory Aplikasi

```bash
# Buat directory
sudo mkdir -p /var/www/botaxxx
sudo chown $USER:$USER /var/www/botaxxx
cd /var/www/botaxxx
```

### 5.2 Clone Repository

```bash
# Clone repository
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git .

# Atau jika sudah ada, pull latest
git pull origin main
```

---

## 6. Setup Backend

### 6.1 Buat Virtual Environment

```bash
cd /var/www/botaxxx/backend

# Buat virtual environment
python3.11 -m venv venv

# Aktifkan virtual environment
source venv/bin/activate
```

**Note:** Setelah ini, prompt Anda akan menampilkan `(venv)` di depan.

### 6.2 Install Dependencies

```bash
# Upgrade pip (jika error, skip langkah ini)
pip install --upgrade pip

# Jika muncul error "uninstall-no-record-file", skip upgrade dan langsung install:
# pip install -r requirements.txt

# Install semua dependencies
pip install -r requirements.txt
```

**⚠️ Jika error saat upgrade pip:**
Error `uninstall-no-record-file` adalah normal di Debian/Ubuntu. Langsung install requirements tanpa upgrade pip:
```bash
pip install -r requirements.txt
```

### 6.3 Generate SECRET_KEY

```bash
# Generate SECRET_KEY yang aman
python3.11 -c "import secrets; print(secrets.token_urlsafe(32))"
```

**Catat SECRET_KEY Anda:**
```
SECRET_KEY: _________________
```

### 6.4 Buat File .env

```bash
# Buat file .env
nano .env
```

Isi dengan konfigurasi berikut (ganti dengan nilai yang sesuai):

```env
# Database
DATABASE_URL=postgresql://botaxxx:YOUR_DB_PASSWORD@localhost:5432/botaxxx_db

# Security
SECRET_KEY=YOUR_SECRET_KEY_HERE
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Google OAuth (opsional, bisa dikosongkan dulu)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_PER_MINUTE=60
```

**Ganti:**
- `YOUR_DB_PASSWORD` dengan password database yang Anda catat di step 4.1
- `YOUR_SECRET_KEY_HERE` dengan SECRET_KEY yang Anda generate di step 6.3
- `yourdomain.com` dengan domain Anda (atau IP VPS jika belum punya domain)

Simpan dengan `Ctrl+O`, tekan `Enter`, lalu `Ctrl+X`.

### 6.5 Run Database Migrations

```bash
# Pastikan virtual environment masih aktif
source venv/bin/activate

# Run migrations
alembic upgrade head
```

**Output yang diharapkan:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial_migration, Initial migration
```

### 6.6 Test Backend (Optional)

```bash
# Test backend secara manual
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Buka browser dan akses `http://your-vps-ip:8000/docs` untuk melihat API documentation.

Tekan `Ctrl+C` untuk stop server.

---

## 7. Setup Frontend

### 7.1 Install Dependencies

```bash
cd /var/www/botaxxx/dashboard

# Install dependencies
npm install
```

### 7.2 Buat File .env

```bash
# Buat file .env
nano .env
```

Isi dengan:

```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

**Atau jika frontend dan backend di domain yang sama:**

```env
VITE_API_BASE_URL=https://yourdomain.com/api
```

**Ganti `yourdomain.com` dengan domain Anda.**

Simpan dengan `Ctrl+O`, tekan `Enter`, lalu `Ctrl+X`.

### 7.3 Build Frontend

```bash
# Build untuk production
npm run build
```

Build output akan ada di `dist/` directory.

**Verifikasi build:**
```bash
ls -la dist/
```

Anda harus melihat file `index.html` dan folder `assets/`.

---

## 8. Setup Telegram Bot

### 8.1 Buat Virtual Environment

```bash
cd /var/www/botaxxx/bot

# Buat virtual environment
python3.11 -m venv venv

# Aktifkan virtual environment
source venv/bin/activate
```

### 8.2 Install Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### 8.3 Buat File .env

```bash
# Buat file .env
nano .env
```

Isi dengan:

```env
# Telegram Bot Token (dari @BotFather)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token-here

# API Configuration
API_BASE_URL=https://api.yourdomain.com
```

**Ganti:**
- `your-telegram-bot-token-here` dengan token dari @BotFather
- `yourdomain.com` dengan domain Anda

**Cara mendapatkan Telegram Bot Token:**
1. Buka Telegram, cari [@BotFather](https://t.me/BotFather)
2. Kirim `/newbot`
3. Ikuti instruksi untuk membuat bot
4. Copy token yang diberikan
5. Paste token ke file `.env`

Simpan dengan `Ctrl+O`, tekan `Enter`, lalu `Ctrl+X`.

---

## 9. Setup Systemd Services

### 9.1 Buat Log Directory

```bash
# Buat directory untuk logs
sudo mkdir -p /var/log/botaxxx
sudo chown www-data:www-data /var/log/botaxxx
```

### 9.2 Buat Backend Service

```bash
# Buat service file
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
StandardOutput=append:/var/log/botaxxx/backend.log
StandardError=append:/var/log/botaxxx/backend.error.log

[Install]
WantedBy=multi-user.target
```

Simpan dengan `Ctrl+O`, tekan `Enter`, lalu `Ctrl+X`.

### 9.3 Buat Bot Service

```bash
# Buat service file
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
StandardOutput=append:/var/log/botaxxx/bot.log
StandardError=append:/var/log/botaxxx/bot.error.log

[Install]
WantedBy=multi-user.target
```

Simpan dengan `Ctrl+O`, tekan `Enter`, lalu `Ctrl+X`.

### 9.4 Enable dan Start Services

```bash
# Reload systemd untuk membaca service baru
sudo systemctl daemon-reload

# Enable services (auto-start on boot)
sudo systemctl enable botaxxx-backend
sudo systemctl enable botaxxx-bot

# Start services
sudo systemctl start botaxxx-backend
sudo systemctl start botaxxx-bot

# Check status
sudo systemctl status botaxxx-backend
sudo systemctl status botaxxx-bot
```

**Output yang diharapkan:**
```
● botaxxx-backend.service - BOTAXXX Backend API
     Loaded: loaded (/etc/systemd/system/botaxxx-backend.service; enabled)
     Active: active (running) since ...
```

Tekan `q` untuk keluar dari status view.

---

## 10. Setup Nginx Reverse Proxy

### 10.1 Buat Nginx Configuration

```bash
# Buat config file
sudo nano /etc/nginx/sites-available/botaxxx
```

**Opsi 1: Subdomain Terpisah (Recommended)**

Jika Anda menggunakan subdomain terpisah (misal: `api.example.com` dan `example.com`):

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

**Opsi 2: Same Domain (Frontend dan Backend di Domain Sama)**

Jika frontend dan backend di domain yang sama:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    root /var/www/botaxxx/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
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

**Ganti `yourdomain.com` dengan domain Anda.**

Simpan dengan `Ctrl+O`, tekan `Enter`, lalu `Ctrl+X`.

### 10.2 Enable Site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/botaxxx /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
```

**Output yang diharapkan:**
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 10.3 Reload Nginx

```bash
# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx
```

---

## 11. Setup SSL Certificate

### 11.1 Persiapan DNS

**⚠️ PENTING:** Pastikan DNS domain sudah mengarah ke IP VPS sebelum lanjut!

**Cek DNS:**
```bash
# Cek apakah domain sudah mengarah ke IP VPS
nslookup yourdomain.com
# atau
dig yourdomain.com
```

Pastikan hasilnya menunjukkan IP VPS Anda.

### 11.2 Get SSL Certificate

**Opsi 1: Subdomain Terpisah**

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

**Opsi 2: Same Domain**

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot akan:
- Meminta email untuk notifikasi
- Meminta persetujuan terms of service
- Generate SSL certificate
- Update Nginx configuration otomatis
- Setup auto-renewal

### 11.3 Test Auto-Renewal

```bash
# Test auto-renewal (dry run)
sudo certbot renew --dry-run
```

**Output yang diharapkan:**
```
The dry run was successful.
```

### 11.4 Set Permissions

```bash
# Set ownership untuk semua file aplikasi
sudo chown -R www-data:www-data /var/www/botaxxx
sudo chmod -R 755 /var/www/botaxxx
```

---

## 12. Verifikasi & Testing

### 12.1 Check Service Status

```bash
# Check semua services
sudo systemctl status botaxxx-backend
sudo systemctl status botaxxx-bot
sudo systemctl status nginx
sudo systemctl status postgresql
```

Semua harus menunjukkan `active (running)`.

### 12.2 Check Logs

```bash
# Backend logs
sudo journalctl -u botaxxx-backend -n 50 --no-pager

# Bot logs
sudo journalctl -u botaxxx-bot -n 50 --no-pager

# File logs
tail -f /var/log/botaxxx/backend.log
tail -f /var/log/botaxxx/bot.log
```

### 12.3 Test API

```bash
# Test health endpoint
curl https://api.yourdomain.com/health
# atau
curl https://yourdomain.com/api/health
```

**Output yang diharapkan:**
```json
{"status":"healthy"}
```

### 12.4 Test Frontend

Buka browser dan akses:
- Frontend: `https://yourdomain.com`
- API Docs: `https://api.yourdomain.com/docs` atau `https://yourdomain.com/api/docs`

### 12.5 Test Telegram Bot

1. Buka Telegram
2. Cari bot Anda (nama yang Anda berikan ke @BotFather)
3. Kirim `/start`
4. Bot harus merespons

Jika bot tidak merespons, check logs:
```bash
sudo journalctl -u botaxxx-bot -f
```

---

## 13. Maintenance & Update

### 13.1 Update Aplikasi

```bash
cd /var/www/botaxxx

# Pull latest code
git pull origin main

# Update Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
sudo systemctl restart botaxxx-backend

# Update Frontend
cd ../dashboard
npm install
npm run build
sudo systemctl reload nginx

# Update Bot
cd ../bot
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart botaxxx-bot
```

### 13.2 Backup Database

```bash
# Buat backup script
sudo nano /usr/local/bin/backup-botaxxx.sh
```

Isi dengan:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/botaxxx"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
PGPASSWORD='YOUR_DB_PASSWORD' pg_dump -U botaxxx -h localhost botaxxx_db > $BACKUP_DIR/botaxxx_$DATE.sql
gzip $BACKUP_DIR/botaxxx_$DATE.sql
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
echo "Backup completed: botaxxx_$DATE.sql.gz"
```

**Ganti `YOUR_DB_PASSWORD` dengan password database Anda.**

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-botaxxx.sh

# Test backup
sudo /usr/local/bin/backup-botaxxx.sh

# Setup cron untuk backup harian (jam 2 pagi)
sudo crontab -e
```

Tambahkan baris ini:
```
0 2 * * * /usr/local/bin/backup-botaxxx.sh
```

### 13.3 Useful Commands

**View Logs:**
```bash
# Backend logs (real-time)
sudo journalctl -u botaxxx-backend -f

# Bot logs (real-time)
sudo journalctl -u botaxxx-bot -f

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**Restart Services:**
```bash
sudo systemctl restart botaxxx-backend
sudo systemctl restart botaxxx-bot
sudo systemctl restart nginx
```

**Check Service Status:**
```bash
sudo systemctl status botaxxx-backend
sudo systemctl status botaxxx-bot
```

---

## ✅ Checklist Final

Sebelum menganggap setup selesai, pastikan:

- [ ] Semua services running (`systemctl status`)
- [ ] Backend API accessible (`/health` endpoint)
- [ ] Frontend accessible di browser
- [ ] SSL certificate terpasang (HTTPS working)
- [ ] Database connection working
- [ ] Telegram bot responding
- [ ] Logs tidak ada error
- [ ] Firewall configured correctly
- [ ] Backup script setup (optional)

---

## 🐛 Troubleshooting

### Backend tidak jalan

```bash
# Check logs
sudo journalctl -u botaxxx-backend -n 50

# Check .env file
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

# Check .env file
cat /var/www/botaxxx/bot/.env

# Pastikan TELEGRAM_BOT_TOKEN sudah di-set
```

### Pip installation error

Jika muncul error `uninstall-no-record-file` saat install pip:

```bash
# Solusi 1: Skip upgrade pip (Recommended)
# Di virtual environment, langsung install tanpa upgrade
cd /var/www/botaxxx/backend
source venv/bin/activate
pip install -r requirements.txt

# Solusi 2: Gunakan --break-system-packages
python3.11 -m pip install --upgrade pip --break-system-packages

# Solusi 3: Install dengan --user
python3.11 -m pip install --upgrade pip --user
```

**Lihat `FIX_PIP_ERROR.md` untuk solusi lengkap.**

### Nginx error

```bash
# Test configuration
sudo nginx -t

# Check error log
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

### SSL Certificate error

```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew

# Check nginx config after certbot
sudo nginx -t
```

---

## 🎉 Selesai!

Selamat! BOTAXXX Financial Command Center sudah berjalan di VPS Anda!

**Access URLs:**
- Frontend: `https://yourdomain.com`
- API Docs: `https://api.yourdomain.com/docs` atau `https://yourdomain.com/api/docs`
- Health Check: `https://api.yourdomain.com/health`

**Next Steps:**
1. Test semua fitur di dashboard
2. Test Telegram bot dengan berbagai command
3. Setup monitoring (opsional: Prometheus, Grafana)
4. Setup alerts untuk downtime
5. Regular backup verification

**Support:**
Jika ada masalah, check:
- Logs: `journalctl -u service-name -f`
- Documentation: `README.md`, `DEPLOY_VPS.md`
- GitHub Issues: [Repository Issues](https://github.com/deklan400/BOTAXXX_TABUNGAN/issues)

---

**Selamat menggunakan BOTAXXX! 🚀**

