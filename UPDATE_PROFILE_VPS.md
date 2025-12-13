# Langkah Update Profile Management di VPS

## 🚀 QUICK START - Copy Paste Langsung

```bash
# ============================================
# LANGKAH 1: Masuk ke VPS dan direktori aplikasi
# ============================================
ssh root@your-vps-ip
cd /path/to/your/app  # SESUAIKAN PATH ANDA

# ============================================
# LANGKAH 2: Pull perubahan dari GitHub
# ============================================
git pull origin main

# ============================================
# LANGKAH 3: Buat folder avatars
# ============================================
mkdir -p dashboard/public/avatars
chmod 755 dashboard/public/avatars
chown -R www-data:www-data dashboard/public/avatars

# ============================================
# LANGKAH 4: Install dependencies backend
# ============================================
cd backend
source venv/bin/activate  # atau: source .venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# ============================================
# LANGKAH 5: Install dependencies frontend
# ============================================
cd dashboard
npm install
npm run build
cd ..

# ============================================
# LANGKAH 6: Database migration (jika ada)
# ============================================
cd backend
source venv/bin/activate
alembic upgrade head
deactivate
cd ..

# ============================================
# LANGKAH 7: Restart services
# ============================================
sudo systemctl restart botaxxx-backend  # SESUAIKAN NAMA SERVICE ANDA
sudo systemctl restart nginx

# ============================================
# LANGKAH 8: Verifikasi
# ============================================
ls -la dashboard/public/avatars/
echo "Update selesai! Test di browser sekarang."
```

---

## 📋 LANGKAH DETAIL (Penjelasan Lengkap)

## 1. Masuk ke VPS
```bash
ssh root@your-vps-ip
# atau
ssh username@your-vps-ip
```

## 2. Masuk ke Direktori Aplikasi
```bash
cd /path/to/your/app
# Contoh: cd /var/www/botaxxx atau cd /home/user/botaxxx
```

## 3. Backup Database (Opsional tapi Disarankan)
```bash
# Backup database PostgreSQL
pg_dump -U botaxxx -d botaxxx_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Atau jika menggunakan docker
docker exec -t your-postgres-container pg_dump -U botaxxx botaxxx_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## 4. Pull Perubahan dari GitHub
```bash
git pull origin main
```

## 5. Buat Folder untuk Avatar (Jika Belum Ada)
```bash
# Pastikan folder avatars ada
mkdir -p dashboard/public/avatars

# Set permission agar bisa ditulis
chmod 755 dashboard/public/avatars

# Jika menggunakan nginx, pastikan nginx bisa akses
chown -R www-data:www-data dashboard/public/avatars
# atau
chown -R nginx:nginx dashboard/public/avatars
```

## 6. Install Dependencies Backend (Jika Ada Perubahan)
```bash
# Masuk ke folder backend
cd backend

# Aktifkan virtual environment (jika menggunakan)
source venv/bin/activate
# atau
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Keluar dari virtual environment
deactivate

# Kembali ke root
cd ..
```

## 7. Install Dependencies Frontend (Jika Ada Perubahan)
```bash
# Masuk ke folder dashboard
cd dashboard

# Install dependencies
npm install

# Build frontend
npm run build

# Kembali ke root
cd ..
```

## 8. Jalankan Database Migration (Jika Ada)
```bash
# Masuk ke folder backend
cd backend

# Aktifkan virtual environment
source venv/bin/activate
# atau
source .venv/bin/activate

# Jalankan migration
alembic upgrade head

# Keluar dari virtual environment
deactivate

# Kembali ke root
cd ..
```

## 9. Restart Backend Service
```bash
# Jika menggunakan systemd
sudo systemctl restart botaxxx-backend
# atau
sudo systemctl restart gunicorn
# atau nama service Anda

# Jika menggunakan PM2
pm2 restart botaxxx-backend
# atau
pm2 restart all

# Jika menggunakan supervisor
sudo supervisorctl restart botaxxx-backend

# Jika menggunakan docker-compose
docker-compose restart backend
# atau
docker-compose up -d --build backend
```

## 10. Restart Nginx (Jika Menggunakan)
```bash
sudo systemctl restart nginx
# atau
sudo service nginx restart

# Test konfigurasi nginx
sudo nginx -t
```

## 11. Verifikasi Folder Avatar Bisa Diakses
```bash
# Test apakah folder bisa ditulis
touch dashboard/public/avatars/test.txt
rm dashboard/public/avatars/test.txt

# Jika error, set permission lagi
chmod -R 755 dashboard/public/avatars
chown -R www-data:www-data dashboard/public/avatars
```

## 12. Cek Log untuk Memastikan Tidak Ada Error
```bash
# Cek log backend
tail -f /var/log/botaxxx/backend.log
# atau
journalctl -u botaxxx-backend -f
# atau
pm2 logs botaxxx-backend

# Cek log nginx
tail -f /var/log/nginx/error.log
```

## 13. Test Aplikasi
```bash
# Test endpoint health
curl http://localhost:8000/health

# Test endpoint maintenance
curl http://localhost:8000/maintenance
```

## 14. Verifikasi di Browser
1. Buka aplikasi di browser
2. Login ke dashboard
3. Buka halaman Settings
4. Coba upload avatar dan update nama
5. Cek apakah avatar muncul di Navbar dan Sidebar

## Troubleshooting

### Jika Avatar Tidak Muncul Setelah Upload:
```bash
# Cek apakah file terupload
ls -la dashboard/public/avatars/

# Cek permission folder
ls -ld dashboard/public/avatars/

# Cek nginx config untuk serve static files
# Pastikan ada konfigurasi seperti ini di nginx:
# location /avatars/ {
#     alias /path/to/app/dashboard/public/avatars/;
# }
```

### Jika Error Permission Denied:
```bash
# Set ownership ke user yang menjalankan aplikasi
sudo chown -R $USER:$USER dashboard/public/avatars

# Atau ke www-data/nginx
sudo chown -R www-data:www-data dashboard/public/avatars
sudo chmod -R 755 dashboard/public/avatars
```

### Jika Error 500 Internal Server Error:
```bash
# Cek log backend untuk detail error
tail -100 /var/log/botaxxx/backend.log

# Cek apakah folder ada
ls -la dashboard/public/avatars/

# Cek apakah database connection OK
cd backend
source venv/bin/activate
python -c "from app.db.session import SessionLocal; db = SessionLocal(); print('DB OK')"
```

### Jika File Upload Gagal:
```bash
# Cek ukuran file (max 5MB)
# Cek format file (harus PNG, JPG, JPEG, GIF, WEBP)

# Cek nginx client_max_body_size
# Pastikan di nginx config ada:
# client_max_body_size 10M;
```

## Script Lengkap (Copy Paste Semua Sekaligus)

```bash
#!/bin/bash

# 1. Masuk ke direktori aplikasi (SESUAIKAN PATH ANDA)
cd /path/to/your/app

# 2. Backup database (OPSIONAL)
# pg_dump -U botaxxx -d botaxxx_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Pull perubahan
git pull origin main

# 4. Buat folder avatars
mkdir -p dashboard/public/avatars
chmod 755 dashboard/public/avatars
chown -R www-data:www-data dashboard/public/avatars

# 5. Install dependencies backend
cd backend
source venv/bin/activate  # atau: source .venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# 6. Install dependencies frontend
cd dashboard
npm install
npm run build
cd ..

# 7. Database migration (jika ada)
cd backend
source venv/bin/activate
alembic upgrade head
deactivate
cd ..

# 8. Restart services
sudo systemctl restart botaxxx-backend  # SESUAIKAN NAMA SERVICE ANDA
sudo systemctl restart nginx

# 9. Verifikasi
echo "Update selesai! Cek log untuk memastikan tidak ada error:"
echo "tail -f /var/log/botaxxx/backend.log"
```

## Catatan Penting

1. **Sesuaikan path** di script dengan path aplikasi Anda
2. **Sesuaikan nama service** dengan nama service backend Anda
3. **Sesuaikan user/group** untuk permission (www-data, nginx, atau user aplikasi Anda)
4. **Backup database** sebelum update (terutama di production)
5. **Test di staging** dulu jika memungkinkan sebelum update production

## Setelah Update

1. Test upload avatar di Settings page
2. Test update nama di Settings page
3. Verifikasi avatar muncul di Navbar dan Sidebar
4. Cek log untuk memastikan tidak ada error

