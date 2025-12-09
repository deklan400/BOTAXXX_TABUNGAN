# 🔧 Troubleshooting BOTAXXX

## 📋 Daftar Isi
1. [Backend Errors](#backend-errors)
2. [Bot Errors](#bot-errors)
3. [Dashboard Errors](#dashboard-errors)
4. [Database Errors](#database-errors)
5. [Google OAuth Errors](#google-oauth-errors)
6. [Authentication Errors](#authentication-errors)
7. [Common Issues](#common-issues)

---

## Backend Errors

### Error: `status=1/FAILURE` - Backend tidak bisa start

**Gejala:**
```bash
sudo systemctl status botaxxx-backend
# Active: activating (auto-restart) (Result: exit-code)
```

**Solusi:**

1. **Check Error Logs:**
```bash
sudo journalctl -u botaxxx-backend -n 50 --no-pager
sudo tail -50 /var/log/botaxxx/backend.error.log
```

2. **Test Imports:**
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
python3.11 test_imports.py
```

3. **Check Model Imports:**
```bash
python3.11 -c "from app.main import app; print('OK')"
```

4. **Run Migration:**
```bash
alembic upgrade head
```

5. **Check .env File:**
```bash
cat .env | grep -E "SECRET_KEY|DATABASE_URL"
```

6. **Restart Service:**
```bash
sudo systemctl restart botaxxx-backend
sudo systemctl status botaxxx-backend
```

---

### Error: `bcrypt` version compatibility

**Gejala:**
```
AttributeError: module 'bcrypt' has no attribute '__about__'
```

**Solusi:**
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
pip install "bcrypt<4.0.0"
pip install -r requirements.txt
sudo systemctl restart botaxxx-backend
```

---

### Error: `NameError: name 'List' is not defined`

**Gejala:**
```
NameError: name 'List' is not defined
```

**Solusi:**
```bash
# Update code dari GitHub
cd /var/www/botaxxx/backend
git pull origin main
sudo systemctl restart botaxxx-backend
```

---

### Error: `ModuleNotFoundError: No module named 'app'`

**Solusi:**
```bash
# Pastikan virtual environment aktif
cd /var/www/botaxxx/backend
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt

# Test
python3.11 test_imports.py
```

---

## Bot Errors

### Error: Bot tidak jalan

**Gejala:**
```bash
sudo systemctl status botaxxx-bot
# Active: failed
```

**Solusi:**

1. **Check Error Logs:**
```bash
sudo tail -50 /var/log/botaxxx/bot.error.log
sudo journalctl -u botaxxx-bot -n 50 --no-pager
```

2. **Check Telegram Token:**
```bash
cat /var/www/botaxxx/bot/.env | grep TELEGRAM_BOT_TOKEN
```

3. **Check Permissions:**
```bash
sudo ls -la /var/www/botaxxx/bot/data/
sudo chown -R www-data:www-data /var/www/botaxxx/bot/data
sudo chmod 755 /var/www/botaxxx/bot/data
```

4. **Test Bot Manual:**
```bash
cd /var/www/botaxxx/bot
source venv/bin/activate
python3.11 main.py
# Press Ctrl+C untuk stop
```

5. **Restart Service:**
```bash
sudo systemctl restart botaxxx-bot
```

---

### Error: `Permission denied: 'user_states.json'`

**Gejala:**
```
PermissionError: [Errno 13] Permission denied: 'user_states.json'
```

**Solusi:**
```bash
sudo mkdir -p /var/www/botaxxx/bot/data
sudo chown www-data:www-data /var/www/botaxxx/bot/data
sudo chmod 755 /var/www/botaxxx/bot/data
sudo -u www-data touch /var/www/botaxxx/bot/data/user_states.json
sudo -u www-data echo '{}' > /var/www/botaxxx/bot/data/user_states.json
sudo chmod 644 /var/www/botaxxx/bot/data/user_states.json
sudo systemctl restart botaxxx-bot
```

---

### Error: `Message is not modified`

**Gejala:**
```
Error: Message is not modified: specified new message content and reply markup are exactly the same
```

**Solusi:**
```bash
# Update code dari GitHub (sudah diperbaiki)
cd /var/www/botaxxx/bot
git pull origin main
sudo systemctl restart botaxxx-bot
```

---

### Error: Bot tidak merespons

**Gejala:**
- Bot tidak menjawab command
- Bot tidak menampilkan menu

**Solusi:**

1. **Check Bot Running:**
```bash
sudo systemctl status botaxxx-bot
```

2. **Check Backend Running:**
```bash
curl http://localhost:8000/health
```

3. **Check Telegram ID Linked:**
- Login ke dashboard
- Buka Profile page
- Pastikan Telegram ID sudah ditambahkan

4. **Test Authentication:**
```bash
curl -X POST http://localhost:8000/auth/telegram-login \
  -H "Content-Type: application/json" \
  -d '{"telegram_id":"YOUR_TELEGRAM_ID","telegram_username":"your_username"}'
```

---

## Dashboard Errors

### Error: Dashboard tidak muncul

**Gejala:**
- Blank page
- 404 error

**Solusi:**

1. **Check Nginx:**
```bash
sudo systemctl status nginx
sudo nginx -t
```

2. **Check Build:**
```bash
ls -la /var/www/botaxxx/dashboard/dist/
```

3. **Rebuild:**
```bash
cd /var/www/botaxxx/dashboard
npm run build
sudo systemctl reload nginx
```

4. **Check Nginx Config:**
```bash
sudo cat /etc/nginx/sites-available/botaxxx
```

---

### Error: API calls failed

**Gejala:**
- Dashboard tidak bisa load data
- Error di browser console

**Solusi:**

1. **Check Backend:**
```bash
curl http://localhost:8000/health
```

2. **Check CORS:**
```bash
# Pastikan CORS_ORIGINS di backend .env include frontend URL
cat /var/www/botaxxx/backend/.env | grep CORS_ORIGINS
```

3. **Check API URL:**
```bash
# Pastikan VITE_API_BASE_URL benar (jika ada)
cat /var/www/botaxxx/dashboard/.env
```

---

## Database Errors

### Error: Database connection failed

**Gejala:**
```
OperationalError: could not connect to server
```

**Solusi:**

1. **Check PostgreSQL:**
```bash
sudo systemctl status postgresql
```

2. **Test Connection:**
```bash
sudo -u postgres psql -d botaxxx_db -c "SELECT 1;"
```

3. **Check Database Exists:**
```bash
sudo -u postgres psql -l | grep botaxxx_db
```

4. **Check .env:**
```bash
cat /var/www/botaxxx/backend/.env | grep DATABASE_URL
```

5. **Recreate Database (jika perlu):**
```bash
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS botaxxx_db;
CREATE DATABASE botaxxx_db;
GRANT ALL PRIVILEGES ON DATABASE botaxxx_db TO botaxxx;
\q
EOF

cd /var/www/botaxxx/backend
source venv/bin/activate
alembic upgrade head
```

---

### Error: Migration failed

**Gejala:**
```
alembic.util.exc.CommandError: Target database is not up to date
```

**Solusi:**
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate

# Check current migration
alembic current

# Upgrade to latest
alembic upgrade head

# Jika error, bisa downgrade dulu
alembic downgrade -1
alembic upgrade head
```

---

## Google OAuth Errors

### Error: `{"detail":"Google OAuth failed"}`

**Gejala:**
- Error saat klik "Login with Google"

**Solusi:**

1. **Check Configuration:**
```bash
cd /var/www/botaxxx/backend
cat .env | grep GOOGLE
```

2. **Check Error Detail:**
```bash
sudo tail -50 /var/log/botaxxx/backend.error.log | grep -i google
```

3. **Setup Google OAuth:**
- Buka [Google Cloud Console](https://console.cloud.google.com/)
- Create OAuth 2.0 Client ID
- Set redirect URI: `http://YOUR_IP:8000/auth/google/callback`
- Copy Client ID dan Secret ke `.env`

4. **Update .env:**
```bash
nano /var/www/botaxxx/backend/.env
# Tambahkan:
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://YOUR_IP:8000/auth/google/callback
```

5. **Restart Backend:**
```bash
sudo systemctl restart botaxxx-backend
```

**Note:** Google OAuth **GRATIS**, tidak perlu kartu kredit.

---

### Error: `redirect_uri_mismatch`

**Solusi:**
- Pastikan redirect URI di Google Console **exact match** dengan `.env`
- Harus include protocol (http://)
- Harus include port jika ada
- Tidak boleh ada trailing slash

**Contoh benar:**
```
http://159.195.13.157:8000/auth/google/callback
```

---

## Authentication Errors

### Error: `{"detail":"Not authenticated"}`

**Gejala:**
- Error saat akses API langsung via browser

**Penjelasan:**
- Ini **normal** - API endpoints memerlukan authentication
- Akses via dashboard, bukan langsung ke API

**Solusi:**
1. Buka dashboard: `http://YOUR_IP`
2. Login dengan email/password
3. Dashboard otomatis mengirim token

---

### Error: Telegram login failed

**Gejala:**
- Bot tidak bisa authenticate
- Error: "Telegram ID not found"

**Solusi:**

1. **Link Telegram ID:**
   - Login ke dashboard
   - Buka Profile page
   - Scroll ke "Telegram Integrations"
   - Add Telegram ID

2. **Get Telegram ID:**
   - Buka Telegram
   - Cari @userinfobot
   - Kirim `/start`
   - Copy ID yang diberikan

3. **Test Authentication:**
```bash
curl -X POST http://localhost:8000/auth/telegram-login \
  -H "Content-Type: application/json" \
  -d '{"telegram_id":"YOUR_TELEGRAM_ID","telegram_username":"your_username"}'
```

---

## Common Issues

### Issue: Services tidak jalan setelah reboot

**Solusi:**
```bash
# Pastikan services enabled
sudo systemctl enable botaxxx-backend botaxxx-bot nginx postgresql

# Check status
sudo systemctl is-enabled botaxxx-backend botaxxx-bot
```

---

### Issue: Port 8000 sudah digunakan

**Solusi:**
```bash
# Check apa yang menggunakan port 8000
sudo lsof -i :8000

# Kill process jika perlu
sudo kill -9 PID

# Atau ubah port di backend service
sudo nano /etc/systemd/system/botaxxx-backend.service
# Ubah --port 8000 ke port lain
```

---

### Issue: Git pull error

**Solusi:**
```bash
# Backup dulu
sudo cp -r /var/www/botaxxx /var/www/botaxxx.backup

# Reset local changes
cd /var/www/botaxxx
sudo git reset --hard HEAD
sudo git pull origin main
```

---

### Issue: Permission denied

**Solusi:**
```bash
# Set ownership
sudo chown -R www-data:www-data /var/www/botaxxx

# Set permissions
sudo chmod -R 755 /var/www/botaxxx
sudo chmod -R 755 /var/www/botaxxx/backend/venv
sudo chmod -R 755 /var/www/botaxxx/bot/venv
```

---

## Quick Diagnostic Commands

```bash
# Check semua services
sudo systemctl status botaxxx-backend botaxxx-bot nginx postgresql

# Check semua logs
sudo tail -20 /var/log/botaxxx/*.log

# Test backend
curl http://localhost:8000/health

# Test database
sudo -u postgres psql -d botaxxx_db -c "SELECT COUNT(*) FROM users;"

# Check disk space
df -h

# Check memory
free -h
```

---

## Still Having Issues?

1. Check semua logs: `sudo tail -50 /var/log/botaxxx/*.log`
2. Check service status: `sudo systemctl status botaxxx-backend botaxxx-bot`
3. Update dari GitHub: `cd /var/www/botaxxx && git pull origin main`
4. Restart semua: `sudo systemctl restart botaxxx-backend botaxxx-bot nginx`
