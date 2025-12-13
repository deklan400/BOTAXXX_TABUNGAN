# Langkah Update Role Management ke VPS

## 🚀 QUICK START - Copy Paste Langsung

```bash
# ============================================
# LANGKAH 1: Masuk ke VPS dan direktori aplikasi
# ============================================
ssh root@159.195.13.157
cd /var/www/botaxxx

# ============================================
# LANGKAH 2: Pull perubahan dari GitHub
# ============================================
git pull origin main

# ============================================
# LANGKAH 3: Install dependencies backend (jika ada perubahan)
# ============================================
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# ============================================
# LANGKAH 4: Install dependencies frontend
# ============================================
cd dashboard
npm install
npm run build
cd ..

# ============================================
# LANGKAH 5: Restart services
# ============================================
sudo systemctl restart botaxxx-backend
sudo systemctl restart nginx

# ============================================
# LANGKAH 6: Verifikasi
# ============================================
echo "Update selesai! Test aplikasi di browser."
```

---

## 📋 LANGKAH DETAIL (Penjelasan Lengkap)

### Langkah 1: Masuk ke VPS

```bash
ssh root@159.195.13.157
# atau jika menggunakan user lain
ssh username@159.195.13.157
```

### Langkah 2: Masuk ke Direktori Aplikasi

```bash
cd /var/www/botaxxx
# Pastikan Anda di direktori yang benar
pwd
```

### Langkah 3: Backup (Opsional tapi Disarankan)

```bash
# Backup database (jika perlu)
pg_dump -U botaxxx -d botaxxx_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup config nginx (jika perlu)
sudo cp /etc/nginx/sites-available/botaxxx /etc/nginx/sites-available/botaxxx.backup.$(date +%Y%m%d_%H%M%S)
```

### Langkah 4: Pull Perubahan dari GitHub

```bash
git pull origin main
```

Jika ada konflik, resolve dulu sebelum lanjut.

### Langkah 5: Install Dependencies Backend

```bash
cd backend

# Aktifkan virtual environment
source venv/bin/activate
# atau jika menggunakan .venv
# source .venv/bin/activate

# Install dependencies (jika ada perubahan)
pip install -r requirements.txt

# Keluar dari virtual environment
deactivate

# Kembali ke root
cd ..
```

### Langkah 6: Install Dependencies Frontend

```bash
cd dashboard

# Install dependencies
npm install

# Build frontend
npm run build

# Kembali ke root
cd ..
```

### Langkah 7: Database Migration (Jika Ada)

```bash
cd backend

# Aktifkan virtual environment
source venv/bin/activate

# Jalankan migration
alembic upgrade head

# Keluar dari virtual environment
deactivate

# Kembali ke root
cd ..
```

### Langkah 8: Restart Backend Service

```bash
# Restart backend service
sudo systemctl restart botaxxx-backend

# Cek status
sudo systemctl status botaxxx-backend
```

### Langkah 9: Restart Nginx

```bash
# Test config nginx dulu
sudo nginx -t

# Jika test berhasil, restart nginx
sudo systemctl restart nginx

# Cek status
sudo systemctl status nginx
```

### Langkah 10: Verifikasi

```bash
# Cek log backend untuk memastikan tidak ada error
tail -f /var/log/botaxxx/backend.log
# atau
journalctl -u botaxxx-backend -f

# Test endpoint health
curl http://localhost:8000/health
```

### Langkah 11: Test di Browser

1. Buka aplikasi di browser: `http://159.195.13.157`
2. Login sebagai admin
3. Buka menu "Role Management" di sidebar admin
4. Test fitur:
   - Cari user
   - Naikkan user ke admin
   - Turunkan admin ke user
5. Pastikan tidak ada error

---

## 🔧 TROUBLESHOOTING

### Jika Error saat Pull

```bash
# Jika ada perubahan lokal yang conflict
git stash
git pull origin main
git stash pop
```

### Jika Build Frontend Error

```bash
# Clear cache dan rebuild
cd dashboard
rm -rf node_modules
rm -rf dist
npm install
npm run build
cd ..
```

### Jika Backend Tidak Start

```bash
# Cek log error
sudo journalctl -u botaxxx-backend -n 50

# Cek apakah port 8000 sudah digunakan
sudo netstat -tulpn | grep 8000

# Restart service
sudo systemctl restart botaxxx-backend
```

### Jika Nginx Error

```bash
# Test config
sudo nginx -t

# Cek error log
sudo tail -f /var/log/nginx/error.log

# Reload config (tanpa restart)
sudo nginx -s reload
```

### Jika Fitur Tidak Muncul

```bash
# Pastikan build frontend berhasil
ls -la dashboard/dist/

# Clear browser cache
# Atau hard refresh: Ctrl+Shift+R (Windows/Linux) atau Cmd+Shift+R (Mac)

# Cek apakah file sudah ter-update
ls -la dashboard/dist/assets/
```

---

## ✅ CHECKLIST UPDATE

- [ ] Pull perubahan dari GitHub berhasil
- [ ] Dependencies backend terinstall
- [ ] Dependencies frontend terinstall
- [ ] Build frontend berhasil
- [ ] Database migration berhasil (jika ada)
- [ ] Backend service restart berhasil
- [ ] Nginx restart berhasil
- [ ] Test aplikasi di browser
- [ ] Menu "Role Management" muncul di sidebar admin
- [ ] Fitur naikkan/turunkan role berfungsi
- [ ] Tidak ada error di console browser
- [ ] Tidak ada error di log backend

---

## 📝 SCRIPT LENGKAP (Copy Paste Semua Sekaligus)

```bash
#!/bin/bash

# Script Update Role Management Feature
# Pastikan untuk menyesuaikan path dan nama service sesuai setup Anda

set -e  # Exit on error

echo "=========================================="
echo "Update Role Management Feature"
echo "=========================================="

# Path aplikasi
APP_PATH="/var/www/botaxxx"
cd "$APP_PATH" || { echo "Error: Gagal masuk ke $APP_PATH"; exit 1; }

echo ""
echo "1. Pull perubahan dari GitHub..."
git pull origin main || { echo "Error: Gagal pull dari GitHub"; exit 1; }

echo ""
echo "2. Install dependencies backend..."
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
    pip install -r requirements.txt
    deactivate
else
    echo "Warning: Virtual environment tidak ditemukan"
    pip install -r requirements.txt
fi
cd ..

echo ""
echo "3. Install dependencies frontend..."
cd dashboard
npm install
npm run build
cd ..

echo ""
echo "4. Database migration (jika ada)..."
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
    alembic upgrade head || echo "Warning: Migration gagal atau tidak ada migration baru"
    deactivate
else
    alembic upgrade head || echo "Warning: Migration gagal atau tidak ada migration baru"
fi
cd ..

echo ""
echo "5. Restart backend service..."
sudo systemctl restart botaxxx-backend || echo "Warning: Gagal restart service"

echo ""
echo "6. Restart Nginx..."
sudo systemctl restart nginx || echo "Warning: Gagal restart nginx"

echo ""
echo "=========================================="
echo "Update Selesai!"
echo "=========================================="
echo ""
echo "Langkah selanjutnya:"
echo "1. Test aplikasi di browser: http://159.195.13.157"
echo "2. Login sebagai admin"
echo "3. Buka menu 'Role Management'"
echo "4. Test fitur naikkan/turunkan role"
echo ""
```

---

## 🎯 CATATAN PENTING

1. **Pastikan backup** sebelum update (terutama di production)
2. **Test di staging** dulu jika memungkinkan
3. **Cek log** setelah update untuk memastikan tidak ada error
4. **Clear browser cache** jika fitur tidak muncul
5. **Restart service** dengan benar untuk memastikan perubahan ter-apply

---

## 📞 SUPPORT

Jika ada masalah:
1. Cek log backend: `tail -f /var/log/botaxxx/backend.log`
2. Cek log nginx: `tail -f /var/log/nginx/error.log`
3. Cek status service: `sudo systemctl status botaxxx-backend`
4. Test endpoint: `curl http://localhost:8000/health`

