# ⚡ Quick Reference: Setup VPS BOTAXXX

Panduan cepat untuk deploy BOTAXXX ke VPS. Untuk panduan lengkap, lihat `SETUP_VPS_LENGKAP.md`.

---

## 🚀 Automated Setup (Recommended)

### Metode 1: Menggunakan Script

```bash
# Login ke VPS
ssh root@your-vps-ip

# Clone repository
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git
cd BOTAXXX_TABUNGAN

# Jalankan script
chmod +x deploy-vps.sh
sudo bash deploy-vps.sh
```

Script akan meminta:
- Domain name
- API subdomain (atau kosongkan untuk same domain)

**Setelah script selesai:**
1. Edit `/var/www/botaxxx/bot/.env` dan tambahkan `TELEGRAM_BOT_TOKEN`
2. Restart bot: `sudo systemctl restart botaxxx-bot`

---

## 📝 Manual Setup (Quick Steps)

### 1. Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential software-properties-common

# Python 3.11
sudo add-apt-repository ppa:deadsnakes/ppa -y
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3.11-dev
curl -sS https://bootstrap.pypa.io/get-pip.py | python3.11 --break-system-packages

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Nginx & Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Setup Database

```bash
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "DB Password: $DB_PASSWORD"  # SIMPAN INI!

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

### 3. Clone & Setup

```bash
sudo mkdir -p /var/www/botaxxx
sudo chown $USER:$USER /var/www/botaxxx
cd /var/www/botaxxx
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git .
```

### 4. Backend Setup

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
# Skip upgrade jika error, langsung install:
pip install -r requirements.txt

# Generate SECRET_KEY
SECRET_KEY=$(python3.11 -c "import secrets; print(secrets.token_urlsafe(32))")
echo "SECRET_KEY: $SECRET_KEY"  # SIMPAN INI!

# Create .env
nano .env
```

**Isi `.env`:**
```env
DATABASE_URL=postgresql://botaxxx:YOUR_DB_PASSWORD@localhost:5432/botaxxx_db
SECRET_KEY=YOUR_SECRET_KEY
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
alembic upgrade head
```

### 5. Frontend Setup

```bash
cd ../dashboard
npm install

# Create .env
echo "VITE_API_BASE_URL=https://api.yourdomain.com" > .env

# Build
npm run build
```

### 6. Bot Setup

```bash
cd ../bot
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create .env
nano .env
```

**Isi `.env`:**
```env
TELEGRAM_BOT_TOKEN=your-token-from-botfather
API_BASE_URL=https://api.yourdomain.com
```

### 7. Systemd Services

```bash
# Create log directory
sudo mkdir -p /var/log/botaxxx
sudo chown www-data:www-data /var/log/botaxxx

# Backend service
sudo nano /etc/systemd/system/botaxxx-backend.service
```

**Isi:**
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

```bash
# Bot service
sudo nano /etc/systemd/system/botaxxx-bot.service
```

**Isi:**
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
# Enable & start
sudo systemctl daemon-reload
sudo systemctl enable botaxxx-backend botaxxx-bot
sudo systemctl start botaxxx-backend botaxxx-bot
```

### 8. Nginx Setup

```bash
sudo nano /etc/nginx/sites-available/botaxxx
```

**Isi (subdomain terpisah):**
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

# Frontend
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

### 9. SSL Setup

```bash
# Pastikan DNS sudah mengarah ke VPS!
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
```

### 10. Set Permissions

```bash
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

# Test API
curl https://api.yourdomain.com/health

# Check logs
sudo journalctl -u botaxxx-backend -f
sudo journalctl -u botaxxx-bot -f
```

---

## 🔧 Useful Commands

```bash
# Restart services
sudo systemctl restart botaxxx-backend
sudo systemctl restart botaxxx-bot
sudo systemctl restart nginx

# View logs
sudo journalctl -u botaxxx-backend -f
sudo journalctl -u botaxxx-bot -f
tail -f /var/log/botaxxx/backend.log

# Update application
cd /var/www/botaxxx
git pull origin main
cd backend && source venv/bin/activate && pip install -r requirements.txt && alembic upgrade head && sudo systemctl restart botaxxx-backend
cd ../dashboard && npm install && npm run build && sudo systemctl reload nginx
cd ../bot && source venv/bin/activate && pip install -r requirements.txt && sudo systemctl restart botaxxx-bot
```

---

## 🐛 Quick Troubleshooting

**Backend tidak jalan:**
```bash
sudo journalctl -u botaxxx-backend -n 50
cat /var/www/botaxxx/backend/.env
```

**Bot tidak jalan:**
```bash
sudo journalctl -u botaxxx-bot -n 50
cat /var/www/botaxxx/bot/.env
```

**Pip installation error:**
```bash
# Jika error "uninstall-no-record-file", skip upgrade pip
cd /var/www/botaxxx/backend
source venv/bin/activate
pip install -r requirements.txt
# Lihat FIX_PIP_ERROR.md untuk solusi lengkap
```

**Nginx error:**
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

---

**Untuk panduan lengkap, lihat `SETUP_VPS_LENGKAP.md`**

