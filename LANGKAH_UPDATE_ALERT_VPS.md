# 🚀 Langkah Update Alert System ke VPS

## 📋 Persiapan

1. Pastikan perubahan sudah di-push ke GitHub (branch `main`) ✅
2. Siapkan akses SSH ke VPS
3. Pastikan Anda punya akses root/sudo di VPS

---

## ⚡ LANGKAH UPDATE (Termasuk Migration Database)

### Step 1: Login ke VPS
```bash
ssh root@159.195.13.157
```

### Step 2: Masuk ke Direktori Aplikasi
```bash
cd /var/www/botaxxx
```

### Step 3: Pull Perubahan Terbaru
```bash
git pull origin main
```

**Output yang diharapkan:**
```
Updating 56981b3..a8500f9
Fast-forward
 backend/alembic/versions/006_add_alerts_table.py |  XX +++++
 backend/app/models/alert.py                     |  XX +++
 ...
```

### Step 4: Update Backend Dependencies
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet
```

### Step 5: ⚠️ PENTING - Run Database Migration
```bash
# Pastikan masih di direktori backend dan venv aktif
alembic upgrade head
```

**Output yang diharapkan:**
```
INFO  [alembic.runtime.migration] Running upgrade 005_add_bank_logo_settings -> 006_add_alerts, add_alerts_table
```

**Catatan:** Migration ini akan membuat tabel `alerts` baru di database.

### Step 6: Rebuild Frontend
```bash
cd ../dashboard
npm install --silent
npm run build
```

**Proses ini memakan waktu 1-2 menit.**

### Step 7: Restart Services
```bash
# Restart backend (penting untuk load model baru)
systemctl restart botaxxx-backend

# Tunggu 2 detik
sleep 2

# Restart bot (jika ada)
systemctl restart botaxxx-bot

# Reload Nginx (untuk frontend)
systemctl reload nginx
```

### Step 8: Verifikasi Services Berjalan
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

### Step 9: Verifikasi Database Migration
```bash
# Login ke PostgreSQL
sudo -u postgres psql botaxxx_db

# Check apakah tabel alerts sudah ada
\dt alerts

# Jika tabel ada, akan muncul:
#                    List of relations
#  Schema |  Name  | Type  | Owner
# --------+--------+-------+--------
#  public | alerts | table | botaxxx

# Keluar dari PostgreSQL
\q
```

### Step 10: Test Aplikasi
Buka browser dan akses:
- Frontend: `http://159.195.13.157` atau domain Anda
- Cek apakah icon bell (🔔) muncul di header dashboard
- Test kirim alert dari admin panel

---

## 🔍 Troubleshooting

### ❌ Migration Error: "Table 'alerts' already exists"

**Solusi:**
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate

# Check migration status
alembic current

# Jika migration sudah jalan, skip
# Jika belum, jalankan:
alembic upgrade head
```

### ❌ Backend Service Tidak Start Setelah Migration

**Check logs:**
```bash
journalctl -u botaxxx-backend -n 100 --no-pager
```

**Kemungkinan masalah:**
- Model Alert belum di-import
- Database connection error

**Solusi:**
```bash
# Pastikan model di-import di backend/app/models/__init__.py
cd /var/www/botaxxx/backend
source venv/bin/activate
python -c "from app.models.alert import Alert; print('OK')"

# Jika error, check file backend/app/models/__init__.py
# Pastikan ada: from app.models.alert import Alert
```

### ❌ Frontend Tidak Menampilkan Alert Bell

**Solusi:**
1. **Clear browser cache:**
   - Chrome/Edge: `Ctrl + Shift + Delete`
   - Atau hard refresh: `Ctrl + Shift + R`

2. **Check build:**
   ```bash
   ls -la /var/www/botaxxx/dashboard/dist
   ```

3. **Rebuild frontend:**
   ```bash
   cd /var/www/botaxxx/dashboard
   npm run build
   systemctl reload nginx
   ```

### ❌ Alert Tidak Muncul di Dashboard

**Check:**
1. Pastikan user sudah login
2. Check browser console untuk error (F12)
3. Check network tab untuk request `/users/me/alerts`
4. Pastikan backend endpoint berjalan:
   ```bash
   curl http://localhost:8000/users/me/alerts -H "Authorization: Bearer YOUR_TOKEN"
   ```

### ❌ Database Migration Gagal

**Rollback migration (HATI-HATI):**
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
alembic downgrade -1
```

**Lalu coba lagi:**
```bash
alembic upgrade head
```

---

## ✅ Checklist Update

Sebelum update:
- [ ] Backup database (opsional tapi disarankan)
- [ ] Noted waktu update (untuk tracking downtime)

Setelah update:
- [ ] Git pull berhasil
- [ ] Database migration berhasil (tabel alerts dibuat)
- [ ] Backend service running
- [ ] Frontend bisa diakses
- [ ] Icon bell (🔔) muncul di header dashboard
- [ ] Test kirim alert dari admin panel
- [ ] Alert muncul di dashboard user
- [ ] Badge notifikasi menampilkan jumlah unread

---

## 🎯 Quick Command Reference

```bash
# Update lengkap dengan migration
cd /var/www/botaxxx && \
git pull origin main && \
cd backend && source venv/bin/activate && \
pip install -r requirements.txt --quiet && \
alembic upgrade head && \
cd ../dashboard && npm install --silent && \
npm run build && \
systemctl restart botaxxx-backend botaxxx-bot && \
systemctl reload nginx

# Check migration status
cd /var/www/botaxxx/backend && source venv/bin/activate && alembic current

# Check tabel alerts
sudo -u postgres psql botaxxx_db -c "\dt alerts"

# View logs
journalctl -u botaxxx-backend -f
```

---

## 📝 Catatan Penting

1. **Database Migration:** Pastikan migration berjalan dengan benar. Tabel `alerts` harus dibuat sebelum backend restart.

2. **Model Import:** Pastikan model `Alert` sudah di-import di `backend/app/models/__init__.py`.

3. **Backend Restart:** Setelah migration, WAJIB restart backend service untuk load model baru.

4. **Frontend Build:** Pastikan frontend di-rebuild untuk include komponen AlertBell baru.

5. **Browser Cache:** User mungkin perlu clear cache atau hard refresh untuk melihat icon bell.

---

## 🆘 Support

Jika ada masalah:
1. Check logs: `journalctl -u botaxxx-backend -n 100`
2. Check database: `sudo -u postgres psql botaxxx_db -c "\dt alerts"`
3. Check migration: `cd /var/www/botaxxx/backend && source venv/bin/activate && alembic current`
4. Hubungi developer/maintainer

---

**Last Updated:** $(date +%Y-%m-%d)

