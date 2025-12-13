# 🚀 Langkah-Langkah Update ke VPS

## 📋 Persiapan

1. Pastikan perubahan sudah di-push ke GitHub (branch `main`)
2. Siapkan akses SSH ke VPS
3. Pastikan Anda punya akses root/sudo di VPS

---

## ⚡ METODE CEPAT (Recommended - 5 Menit)

### Step 1: Login ke VPS
```bash
ssh root@159.195.13.157
# atau
ssh root@VPS_IP_ANDA
```

### Step 2: Masuk ke Direktori Aplikasi
```bash
cd /var/www/botaxxx
```

### Step 3: Download Script Update (jika belum ada)
```bash
git pull origin main
```

### Step 4: Jalankan Script Update
```bash
sudo bash quick-update-vps.sh
```

**Selesai!** Script akan otomatis melakukan semua proses update.

---

## 📝 METODE MANUAL (Step by Step)

Jika script tidak berjalan atau ingin kontrol lebih detail:

### Step 1: Login ke VPS
```bash
ssh root@159.195.13.157
```

### Step 2: Masuk ke Direktori Aplikasi
```bash
cd /var/www/botaxxx
```

### Step 3: Pull Perubahan dari GitHub
```bash
git pull origin main
```

**Output yang diharapkan:**
```
Updating 036cf93..[commit-hash]
Fast-forward
 backend/app/services/auth_service.py      |  XX +++++
 dashboard/src/pages/auth/LoginPage.tsx    |  XX +++
 ...
```

### Step 4: Update Backend Dependencies
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
pip install -r requirements.txt --quiet
```

### Step 5: Run Database Migrations (jika ada)
```bash
alembic upgrade head
```

**Catatan:** Jika tidak ada migration baru, ini akan cepat selesai.

### Step 6: Rebuild Frontend
```bash
cd /var/www/botaxxx/dashboard
npm install --silent
npm run build
```

**Proses ini memakan waktu 1-2 menit.**

### Step 7: Update Bot Dependencies (jika ada perubahan)
```bash
cd /var/www/botaxxx/bot
source venv/bin/activate
pip install -r requirements.txt --quiet
```

### Step 8: Restart Services
```bash
# Restart backend
systemctl restart botaxxx-backend

# Tunggu 2 detik
sleep 2

# Restart bot
systemctl restart botaxxx-bot

# Reload Nginx (untuk frontend)
systemctl reload nginx
```

### Step 9: Verifikasi Services Berjalan
```bash
# Check status semua services
systemctl status botaxxx-backend
systemctl status botaxxx-bot
systemctl status nginx
```

**Output yang diharapkan:**
```
● botaxxx-backend.service - BOTAXXX Backend API
   Loaded: loaded
   Active: active (running)
```

### Step 10: Test Aplikasi
Buka browser dan akses:
- Frontend: `http://159.195.13.157` atau domain Anda
- API Health: `http://159.195.13.157/health`

---

## 🔍 Troubleshooting

### ❌ Git Pull Error: "Your local changes would be overwritten"

**Solusi:**
```bash
cd /var/www/botaxxx
git stash
git pull origin main
git stash pop
```

Atau reset ke remote (HATI-HATI: ini akan menghapus perubahan lokal):
```bash
cd /var/www/botaxxx
git fetch origin
git reset --hard origin/main
```

### ❌ Backend Service Tidak Start

**Check logs:**
```bash
journalctl -u botaxxx-backend -n 50 --no-pager
```

**Restart manual:**
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Check apakah port 8000 sudah digunakan:**
```bash
netstat -tulpn | grep 8000
```

### ❌ Frontend Build Error

**Clear cache dan rebuild:**
```bash
cd /var/www/botaxxx/dashboard
rm -rf node_modules dist
npm install
npm run build
```

### ❌ Frontend Tidak Update di Browser

1. **Clear browser cache:**
   - Chrome/Edge: `Ctrl + Shift + Delete`
   - Atau hard refresh: `Ctrl + Shift + R`

2. **Check file dist:**
   ```bash
   ls -la /var/www/botaxxx/dashboard/dist
   ```

3. **Reload Nginx:**
   ```bash
   systemctl reload nginx
   ```

### ❌ Permission Error

**Fix permissions:**
```bash
chown -R www-data:www-data /var/www/botaxxx
chmod -R 755 /var/www/botaxxx
```

### ❌ Database Migration Error

**Check migration status:**
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
alembic current
alembic history
```

**Rollback jika perlu (HATI-HATI):**
```bash
alembic downgrade -1
```

---

## ✅ Checklist Update

Sebelum update:
- [ ] Perubahan sudah di-push ke GitHub
- [ ] Backup database (opsional tapi disarankan)
- [ ] Noted waktu update (untuk tracking downtime)

Setelah update:
- [ ] Git pull berhasil
- [ ] Backend service running
- [ ] Bot service running (jika ada)
- [ ] Frontend bisa diakses
- [ ] Test login sebagai user biasa
- [ ] Test login sebagai admin
- [ ] Test maintenance mode (aktifkan/nonaktifkan)

---

## 🎯 Quick Command Reference

```bash
# Update cepat (satu command)
cd /var/www/botaxxx && git pull origin main && \
cd backend && source venv/bin/activate && \
pip install -r requirements.txt --quiet && \
alembic upgrade head && \
cd ../dashboard && npm install --silent && \
npm run build && \
systemctl restart botaxxx-backend botaxxx-bot && \
systemctl reload nginx

# Check status
systemctl status botaxxx-backend botaxxx-bot nginx

# View logs
journalctl -u botaxxx-backend -f
journalctl -u botaxxx-bot -f

# Test API
curl http://localhost:8000/health
```

---

## 📞 Support

Jika ada masalah:
1. Check logs: `journalctl -u botaxxx-backend -n 100`
2. Check GitHub untuk perubahan terbaru
3. Hubungi developer/maintainer

---

**Last Updated:** $(date +%Y-%m-%d)

