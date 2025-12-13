# 🚀 BOTAXXX - Panduan Lengkap VPS

Panduan lengkap untuk setup, update, dan troubleshooting aplikasi BOTAXXX di VPS.

---

## 📋 Daftar Isi

1. [Setup VPS dari Awal](#setup-vps-dari-awal)
2. [Update Aplikasi ke VPS](#update-aplikasi-ke-vps)
3. [Troubleshooting](#troubleshooting)
4. [Fix Error 413 - Payload Too Large](#fix-error-413)
5. [Quick Commands](#quick-commands)

---

## 🚀 Setup VPS dari Awal

### Prerequisites

- VPS dengan Ubuntu/Debian
- Root atau sudo access
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Telegram Bot Token (dari @BotFather)

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

### Step 3: Setup Database

```bash
# Buat database dan user
sudo -u postgres psql << EOF
CREATE DATABASE botaxxx_db;
CREATE USER botaxxx WITH PASSWORD 'botaxxx_password';
GRANT ALL PRIVILEGES ON DATABASE botaxxx_db TO botaxxx;
ALTER USER botaxxx CREATEDB;
\q
EOF
```

### Step 4: Clone Repository

```bash
cd /var/www
sudo git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git botaxxx
cd botaxxx
```

### Step 5: Setup Backend

```bash
cd /var/www/botaxxx/backend

# Buat virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Fix bcrypt version (jika error)
pip install "bcrypt<4.0.0"

# Buat .env file
cat > .env << EOF
DATABASE_URL=postgresql://botaxxx:botaxxx_password@localhost:5432/botaxxx_db
SECRET_KEY=$(python3.11 -c "import secrets; print(secrets.token_urlsafe(32))")
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://YOUR_IP,https://YOUR_IP
EOF

# Run migrations
alembic upgrade head
```

### Step 6: Setup Bot

```bash
cd /var/www/botaxxx/bot

# Buat virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Buat .env file
cat > .env << EOF
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
API_BASE_URL=http://localhost:8000
EOF

# Setup permissions
sudo mkdir -p data
sudo chown www-data:www-data data
sudo chmod 755 data
```

### Step 7: Setup Dashboard

```bash
cd /var/www/botaxxx/dashboard

# Install dependencies
npm install

# Build production
npm run build

# Setup permissions
sudo chown -R www-data:www-data /var/www/botaxxx
```

### Step 8: Setup Systemd Services

**Backend Service:**

```bash
sudo nano /etc/systemd/system/botaxxx-backend.service
```

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

[Install]
WantedBy=multi-user.target
```

**Bot Service:**

```bash
sudo nano /etc/systemd/system/botaxxx-bot.service
```

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

[Install]
WantedBy=multi-user.target
```

**Enable dan Start Services:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable botaxxx-backend botaxxx-bot
sudo systemctl start botaxxx-backend botaxxx-bot
```

### Step 9: Setup Nginx

```bash
sudo nano /etc/nginx/sites-available/botaxxx
```

```nginx
server {
    listen 80;
    server_name YOUR_IP_OR_DOMAIN;

    # Fix error 413 - Payload Too Large
    client_max_body_size 10M;

    # Serve static avatars
    location /avatars/ {
        alias /var/www/botaxxx/dashboard/public/avatars/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Backend API routes
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
        rewrite ^/api/(.*) /$1 break;
        
        # Timeout untuk upload besar
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Backend API routes (specific paths)
    location ~ ^/(docs|openapi.json|health|auth|users|overview|savings|loans|targets|banks|admin|maintenance) {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout untuk upload besar
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }

    # Frontend Dashboard
    root /var/www/botaxxx/dashboard/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Enable dan Restart Nginx:**

```bash
sudo ln -s /etc/nginx/sites-available/botaxxx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 10: Set Admin User

```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
python -m app.db.set_admin
# Ikuti instruksi untuk set user sebagai admin
```

---

## 🔄 Update Aplikasi ke VPS

### Metode 1: Menggunakan Script (Recommended)

```bash
cd /var/www/botaxxx
sudo bash update-vps.sh
```

### Metode 2: Manual Update

```bash
# 1. Login ke VPS
ssh root@VPS_IP

# 2. Masuk ke direktori aplikasi
cd /var/www/botaxxx

# 3. Pull perubahan dari GitHub
git pull origin main
chown -R www-data:www-data /var/www/botaxxx

# 4. Update Backend (PENTING: Aktifkan virtual environment!)
cd backend
source venv/bin/activate  # ← INI PENTING!
pip install -r requirements.txt

# 5. Run migrations (jika ada perubahan database)
alembic upgrade head

# 6. Build Frontend
cd ../dashboard
npm install
npm run build
chown -R www-data:www-data /var/www/botaxxx/dashboard/dist

# 7. Update Bot (jika ada perubahan)
cd ../bot
source venv/bin/activate
pip install -r requirements.txt

# 8. Restart Services
cd ..
sudo systemctl restart botaxxx-backend
sudo systemctl restart botaxxx-bot
sudo systemctl reload nginx

# 9. Verifikasi
sudo systemctl status botaxxx-backend botaxxx-bot nginx
```

---

## 🔧 Troubleshooting

### Backend Tidak Start

```bash
# Check logs
sudo journalctl -u botaxxx-backend -n 50 --no-pager

# Check apakah port 8000 sudah digunakan
netstat -tulpn | grep 8000

# Test imports
cd /var/www/botaxxx/backend
source venv/bin/activate
python3.11 test_imports.py

# Restart
sudo systemctl restart botaxxx-backend
```

### Bot Tidak Jalan

```bash
# Check logs
sudo journalctl -u botaxxx-bot -n 50 --no-pager

# Check Telegram Token
cat /var/www/botaxxx/bot/.env | grep TELEGRAM_BOT_TOKEN

# Fix permissions
sudo chown -R www-data:www-data /var/www/botaxxx/bot/data
sudo chmod 755 /var/www/botaxxx/bot/data

# Restart
sudo systemctl restart botaxxx-bot
```

### Database Connection Error

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d botaxxx_db -c "SELECT 1;"

# Check .env
cat /var/www/botaxxx/backend/.env | grep DATABASE_URL
```

### Migration Error

```bash
cd /var/www/botaxxx/backend
source venv/bin/activate

# Check current migration
alembic current

# Upgrade to latest
alembic upgrade head

# Jika error, downgrade dulu
alembic downgrade -1
alembic upgrade head
```

### Frontend Tidak Update

```bash
# Rebuild frontend
cd /var/www/botaxxx/dashboard
npm run build

# Clear browser cache (Ctrl+Shift+R)
# Reload nginx
sudo systemctl reload nginx
```

### Permission Error

```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/botaxxx
sudo chmod -R 755 /var/www/botaxxx
```

---

## 🔧 Fix Error 413 - Payload Too Large

Error 413 terjadi karena file upload melebihi batas yang diizinkan server.

### Solusi Cepat

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/botaxxx

# Tambahkan di dalam block server:
client_max_body_size 10M;

# Test config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Restart backend
sudo systemctl restart botaxxx-backend
```

### Contoh Nginx Config Lengkap

```nginx
server {
    listen 80;
    server_name YOUR_IP_OR_DOMAIN;
    
    # INI YANG PENTING
    client_max_body_size 10M;
    
    # Serve static avatars
    location /avatars/ {
        alias /var/www/botaxxx/dashboard/public/avatars/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout untuk upload besar
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # Frontend
    root /var/www/botaxxx/dashboard/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## ⚡ Quick Commands

### Update Cepat

```bash
cd /var/www/botaxxx && \
git pull origin main && \
cd backend && source venv/bin/activate && pip install -r requirements.txt && alembic upgrade head && \
cd ../dashboard && npm run build && \
cd .. && sudo systemctl restart botaxxx-backend botaxxx-bot && sudo systemctl reload nginx
```

### Check Status

```bash
# Check semua services
sudo systemctl status botaxxx-backend botaxxx-bot nginx

# Check logs
sudo journalctl -u botaxxx-backend -f
sudo journalctl -u botaxxx-bot -f

# Test backend
curl http://localhost:8000/health
```

### Rebuild Frontend Saja

```bash
cd /var/www/botaxxx/dashboard
npm run build
sudo systemctl reload nginx
```

### Restart Semua Services

```bash
sudo systemctl restart botaxxx-backend botaxxx-bot nginx
```

### Backup Database

```bash
sudo -u postgres pg_dump botaxxx_db > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Rollback Update

```bash
cd /var/www/botaxxx
git log --oneline -5  # Lihat commit sebelumnya
git checkout <commit-hash>  # Kembali ke commit sebelumnya
sudo systemctl restart botaxxx-backend botaxxx-bot
```

---

## 📝 Checklist Update

- [ ] Perubahan sudah di-push ke GitHub (branch `main`)
- [ ] Login ke VPS dengan akses root/sudo
- [ ] Pull perubahan dari GitHub
- [ ] Aktifkan virtual environment (`source venv/bin/activate`)
- [ ] Update dependencies (backend & bot)
- [ ] Run database migrations (`alembic upgrade head`)
- [ ] Rebuild frontend (`npm run build`)
- [ ] Restart services
- [ ] Verifikasi services berjalan
- [ ] Test aplikasi di browser

---

## ⚠️ Catatan Penting

1. **Virtual Environment**: Selalu aktifkan virtual environment sebelum `pip install`
   ```bash
   source venv/bin/activate
   ```

2. **Error 413**: Pastikan `client_max_body_size 10M;` ada di nginx config

3. **Permissions**: Setelah update, pastikan permissions benar:
   ```bash
   sudo chown -R www-data:www-data /var/www/botaxxx
   ```

4. **Database Backup**: Sebelum update besar, backup database:
   ```bash
   sudo -u postgres pg_dump botaxxx_db > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql
   ```

5. **Downtime**: Update biasanya memakan waktu 2-5 menit

---

**Last Updated**: 2025-01-XX

