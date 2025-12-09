# 📋 Langkah-Langkah Lengkap BOTAXXX

## 🚀 Setup Awal di VPS

### Step 1: Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git botaxxx
cd botaxxx
```

### Step 2: Setup Backend
```bash
cd backend

# Buat virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Buat .env file
cp .env.example .env  # atau buat manual
nano .env
```

**Isi `.env` backend:**
```bash
SECRET_KEY=your-secret-key-min-32-characters-long-random-string
DATABASE_URL=postgresql://botaxxx:botaxxx_password@localhost:5432/botaxxx_db
CORS_ORIGINS=http://YOUR_IP,http://YOUR_DOMAIN
FRONTEND_URL=http://YOUR_IP

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://YOUR_IP:8000/auth/google/callback
```

### Step 3: Setup Database
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Buat database dan user
sudo -u postgres psql << EOF
CREATE DATABASE botaxxx_db;
CREATE USER botaxxx WITH PASSWORD 'botaxxx_password';
GRANT ALL PRIVILEGES ON DATABASE botaxxx_db TO botaxxx;
\q
EOF

# Run migrations
cd /var/www/botaxxx/backend
source venv/bin/activate
alembic upgrade head
```

### Step 4: Setup Bot
```bash
cd /var/www/botaxxx/bot

# Buat virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Buat .env file
nano .env
```

**Isi `.env` bot:**
```bash
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_from_botfather
API_BASE_URL=http://localhost:8000
```

### Step 5: Setup Dashboard
```bash
cd /var/www/botaxxx/dashboard

# Install dependencies
npm install

# Buat .env file (optional)
nano .env
```

**Isi `.env` dashboard (optional):**
```bash
VITE_API_BASE_URL=http://YOUR_IP:8000
```

**Build dashboard:**
```bash
npm run build
```

### Step 6: Setup Systemd Services

**Backend Service:**
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
StandardOutput=append:/var/log/botaxxx/backend.log
StandardError=append:/var/log/botaxxx/backend.error.log

[Install]
WantedBy=multi-user.target
```

**Bot Service:**
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
StandardOutput=append:/var/log/botaxxx/bot.log
StandardError=append:/var/log/botaxxx/bot.error.log

[Install]
WantedBy=multi-user.target
```

**Setup log directory:**
```bash
sudo mkdir -p /var/log/botaxxx
sudo chown www-data:www-data /var/log/botaxxx
```

**Enable dan start services:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable botaxxx-backend botaxxx-bot
sudo systemctl start botaxxx-backend botaxxx-bot
```

### Step 7: Setup Nginx
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
    location ~ ^/(auth|users|overview|savings|loans|targets|health|docs) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/botaxxx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 8: Setup Permissions
```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/botaxxx

# Set permissions
sudo chmod -R 755 /var/www/botaxxx
sudo chmod -R 755 /var/www/botaxxx/backend/venv
sudo chmod -R 755 /var/www/botaxxx/bot/venv

# Bot data directory
sudo mkdir -p /var/www/botaxxx/bot/data
sudo chown www-data:www-data /var/www/botaxxx/bot/data
sudo chmod 755 /var/www/botaxxx/bot/data
sudo -u www-data touch /var/www/botaxxx/bot/data/user_states.json
sudo -u www-data echo '{}' > /var/www/botaxxx/bot/data/user_states.json
sudo chmod 644 /var/www/botaxxx/bot/data/user_states.json
```

## ✅ Verifikasi Setup

### Check Backend
```bash
# Check service status
sudo systemctl status botaxxx-backend

# Check logs
sudo tail -50 /var/log/botaxxx/backend.log

# Test API
curl http://localhost:8000/health
```

### Check Bot
```bash
# Check service status
sudo systemctl status botaxxx-bot

# Check logs
sudo tail -50 /var/log/botaxxx/bot.log

# Test bot di Telegram
# Kirim /start ke bot
```

### Check Dashboard
```bash
# Check nginx
sudo systemctl status nginx

# Test dashboard
curl http://YOUR_IP
# Should return HTML
```

## 📝 Setup Google OAuth (Optional)

### Step 1: Buat Google OAuth Credentials
1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Create project baru
3. Enable Google+ API
4. Create OAuth 2.0 Client ID:
   - Type: Web application
   - Authorized redirect URI: `http://YOUR_IP:8000/auth/google/callback`
   - Copy Client ID dan Secret

### Step 2: Update Backend .env
```bash
cd /var/www/botaxxx/backend
nano .env
```

Tambahkan:
```bash
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://YOUR_IP:8000/auth/google/callback
```

### Step 3: Restart Backend
```bash
sudo systemctl restart botaxxx-backend
```

## 🔄 Update Aplikasi

### Update dari GitHub
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

## 👤 Cara Menggunakan untuk User

### Step 1: Register
1. Buka `http://YOUR_IP` di browser
2. Klik "Register here"
3. Isi:
   - Full Name
   - Email
   - Password (min 8 karakter)
4. Klik "Create Account"
5. Otomatis login setelah register

### Step 2: Login
**Via Email/Password:**
1. Buka login page
2. Masukkan email dan password
3. Klik "Login"

**Via Google:**
1. Klik "Login with Google"
2. Pilih Google account
3. Otomatis redirect ke dashboard

### Step 3: Link Telegram ID (Optional)
1. Login ke dashboard
2. Klik "Profile" di sidebar
3. Scroll ke "Telegram Integrations"
4. Masukkan:
   - Telegram ID (dapat dari @userinfobot di Telegram)
   - Telegram Username (optional)
5. Klik "Add Telegram ID"

### Step 4: Gunakan Dashboard
**Overview:**
- Lihat financial summary
- Charts dan statistics

**Savings:**
- Klik "Add Transaction"
- Pilih Income atau Expense
- Isi amount, category, note
- Save

**Loans:**
- Klik "Add Loan"
- Isi borrower name, principal
- Add payment untuk bayar pinjaman

**Targets:**
- Klik "Add Target"
- Isi target name, amount
- Update progress secara berkala

### Step 5: Gunakan Bot
1. Buka Telegram
2. Cari bot BOTAXXX
3. Kirim `/start`
4. Bot akan authenticate otomatis
5. Gunakan menu untuk:
   - Check Saldo
   - Manage Tabungan
   - Manage Pinjaman
   - Manage Targets

## 🛠️ Troubleshooting

### Backend tidak jalan
```bash
# Check error
sudo journalctl -u botaxxx-backend -n 50

# Check logs
sudo tail -50 /var/log/botaxxx/backend.error.log

# Test import
cd /var/www/botaxxx/backend
source venv/bin/activate
python test_imports.py
```

### Bot tidak jalan
```bash
# Check error
sudo journalctl -u botaxxx-bot -n 50

# Check logs
sudo tail -50 /var/log/botaxxx/bot.error.log

# Check token
cat /var/www/botaxxx/bot/.env | grep TELEGRAM_BOT_TOKEN
```

### Dashboard tidak muncul
```bash
# Check nginx
sudo systemctl status nginx
sudo nginx -t

# Check build
ls -la /var/www/botaxxx/dashboard/dist/

# Rebuild jika perlu
cd /var/www/botaxxx/dashboard
npm run build
```

### Database error
```bash
# Check PostgreSQL
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d botaxxx_db -c "SELECT 1;"

# Check migrations
cd /var/www/botaxxx/backend
source venv/bin/activate
alembic current
alembic upgrade head
```

## 📊 Monitoring

### Check Services Status
```bash
sudo systemctl status botaxxx-backend botaxxx-bot nginx postgresql
```

### Check Logs
```bash
# Backend logs
sudo tail -f /var/log/botaxxx/backend.log
sudo tail -f /var/log/botaxxx/backend.error.log

# Bot logs
sudo tail -f /var/log/botaxxx/bot.log
sudo tail -f /var/log/botaxxx/bot.error.log
```

### Check API Health
```bash
curl http://localhost:8000/health
```

## 🔐 Security Checklist

- [ ] SECRET_KEY sudah diubah (min 32 karakter)
- [ ] Database password sudah diubah
- [ ] Telegram Bot Token sudah diset
- [ ] File permissions sudah benar
- [ ] Nginx sudah dikonfigurasi dengan benar
- [ ] Firewall sudah dikonfigurasi (jika perlu)
- [ ] HTTPS sudah disetup (untuk production)

## 📞 Quick Commands

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

