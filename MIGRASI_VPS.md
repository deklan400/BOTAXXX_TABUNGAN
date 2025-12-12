# 📦 Panduan Migrasi VPS - BOTAXXX

Dokumentasi lengkap untuk memindahkan aplikasi BOTAXXX dari VPS lama ke VPS baru tanpa kehilangan data.

---

## 📋 Daftar Isi

1. [Persiapan](#persiapan)
2. [Backup Data di VPS Lama](#backup-data-di-vps-lama)
3. [Install di VPS Baru](#install-di-vps-baru)
4. [Restore Data](#restore-data)
5. [Verifikasi](#verifikasi)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Persiapan

### Yang Perlu Disiapkan:

1. **Akses SSH ke VPS lama dan VPS baru**
2. **Akses root/sudo di kedua VPS**
3. **Koneksi internet yang stabil**
4. **Waktu downtime yang direncanakan** (disarankan 1-2 jam)

### Informasi yang Perlu Dicatat:

- Domain/IP VPS lama
- Domain/IP VPS baru
- Database password (jika lupa, bisa direset)
- Telegram Bot Token (jika ada)

---

## 💾 Backup Data di VPS Lama

### Step 1: Login ke VPS Lama

```bash
ssh root@VPS_LAMA_IP
# atau
ssh user@VPS_LAMA_IP
sudo su
```

### Step 2: Buat Backup Manual

#### A. Backup Database

```bash
# Backup database
sudo -u postgres pg_dump botaxxx_db > /tmp/botaxxx_db_backup_$(date +%Y%m%d_%H%M%S).sql

# Atau gunakan script backup otomatis (jika sudah ada)
sudo botaxxx-backup
```

**Lokasi backup:**
- Script otomatis: `/var/backups/botaxxx/db_backup_*.sql`
- Manual: `/tmp/botaxxx_db_backup_*.sql`

#### B. Backup File Penting

```bash
# Buat direktori backup
mkdir -p /tmp/botaxxx_migration_backup
cd /tmp/botaxxx_migration_backup

# Backup .env files
cp /var/www/botaxxx/backend/.env ./backend.env
cp /var/www/botaxxx/bot/.env ./bot.env
cp /var/www/botaxxx/dashboard/.env ./dashboard.env

# Backup deployment info
cp /var/www/botaxxx/deployment_info.txt ./deployment_info.txt

# Backup bank logos
mkdir -p banks
cp -r /var/www/botaxxx/dashboard/public/banks/* ./banks/ 2>/dev/null || echo "No bank logos to backup"

# Backup database dump (jika belum)
if [ -f /var/backups/botaxxx/db_backup_*.sql ]; then
    cp /var/backups/botaxxx/db_backup_*.sql ./database.sql
elif [ -f /tmp/botaxxx_db_backup_*.sql ]; then
    cp /tmp/botaxxx_db_backup_*.sql ./database.sql
fi

# Buat archive
cd /tmp
tar -czf botaxxx_migration_$(date +%Y%m%d_%H%M%S).tar.gz botaxxx_migration_backup/
```

### Step 3: Download Backup ke Local

```bash
# Dari komputer local, download backup
scp root@VPS_LAMA_IP:/tmp/botaxxx_migration_*.tar.gz ./
scp root@VPS_LAMA_IP:/tmp/botaxxx_db_backup_*.sql ./  # Jika backup terpisah
```

**Atau gunakan metode lain:**
- **FTP/SFTP**: Gunakan FileZilla atau WinSCP
- **Cloud Storage**: Upload ke Google Drive/Dropbox
- **Direct Copy**: Jika kedua VPS bisa saling akses

### Step 4: Verifikasi Backup

```bash
# Cek ukuran file backup
ls -lh /tmp/botaxxx_migration_*.tar.gz

# Cek isi backup
tar -tzf /tmp/botaxxx_migration_*.tar.gz

# Cek database backup
head -20 /tmp/botaxxx_db_backup_*.sql
```

**Pastikan backup berisi:**
- ✅ File `.env` (backend, bot, dashboard)
- ✅ File `deployment_info.txt`
- ✅ Folder `banks/` (jika ada logo)
- ✅ File `database.sql`

---

## 🚀 Install di VPS Baru

### Step 1: Upload Backup ke VPS Baru

```bash
# Dari komputer local, upload ke VPS baru
scp botaxxx_migration_*.tar.gz root@VPS_BARU_IP:/tmp/
scp botaxxx_db_backup_*.sql root@VPS_BARU_IP:/tmp/  # Jika terpisah
```

### Step 2: Extract Backup

```bash
# Login ke VPS baru
ssh root@VPS_BARU_IP

# Extract backup
cd /tmp
tar -xzf botaxxx_migration_*.tar.gz
```

### Step 3: Jalankan Install Script

```bash
# Clone atau download install script
cd /tmp
wget https://raw.githubusercontent.com/deklan400/BOTAXXX_TABUNGAN/main/install-vps.sh
# atau
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git temp_repo
cp temp_repo/install-vps.sh ./

# Jalankan install script
sudo bash install-vps.sh
```

**Saat ditanya:**
- Domain: Masukkan domain/IP VPS baru
- API Domain: Sama dengan domain (atau subdomain jika berbeda)
- SSL Email: (Opsional) Email untuk SSL certificate
- Telegram Token: Masukkan token yang sama dari VPS lama
- **Backup existing?**: Pilih `n` (karena VPS baru masih kosong)
- **Restore from backup?**: Pilih `y`
- **Backup file path**: Masukkan `/tmp/botaxxx_migration_backup` atau path lengkap ke backup

### Step 4: Tunggu Install Selesai

Install script akan:
- ✅ Install semua dependencies
- ✅ Setup database
- ✅ Clone repository
- ✅ Setup backend, frontend, bot
- ✅ Restore file dari backup (jika dipilih)
- ✅ Run migrations
- ✅ Seed bank data
- ✅ Setup Nginx
- ✅ Start services

---

## 🔄 Restore Data

### Jika Restore Otomatis Gagal

#### A. Restore Database Manual

```bash
# Login ke VPS baru
ssh root@VPS_BARU_IP

# Copy database backup ke VPS baru (jika belum)
# scp botaxxx_db_backup_*.sql root@VPS_BARU_IP:/tmp/

# Restore database
sudo -u postgres psql botaxxx_db < /tmp/botaxxx_db_backup_*.sql

# Atau jika ada password
PGPASSWORD=DB_PASSWORD psql -U botaxxx -d botaxxx_db -h localhost < /tmp/botaxxx_db_backup_*.sql
```

**Catatan:** Ganti `DB_PASSWORD` dengan password database yang baru (cek di `/var/www/botaxxx/deployment_info.txt`)

#### B. Restore File .env

```bash
# Restore backend .env
cp /tmp/botaxxx_migration_backup/backend.env /var/www/botaxxx/backend/.env

# Update DATABASE_URL jika password berbeda
# Edit /var/www/botaxxx/backend/.env
# Ganti DATABASE_URL dengan password baru dari deployment_info.txt

# Restore bot .env
cp /tmp/botaxxx_migration_backup/bot.env /var/www/botaxxx/bot/.env

# Restore dashboard .env
cp /tmp/botaxxx_migration_backup/dashboard.env /var/www/botaxxx/dashboard/.env

# Set permissions
chown www-data:www-data /var/www/botaxxx/*/.env
chmod 600 /var/www/botaxxx/*/.env
```

#### C. Restore Bank Logos

```bash
# Restore bank logos
mkdir -p /var/www/botaxxx/dashboard/public/banks
cp -r /tmp/botaxxx_migration_backup/banks/* /var/www/botaxxx/dashboard/public/banks/

# Set permissions
chown -R www-data:www-data /var/www/botaxxx/dashboard/public/banks

# Rebuild frontend untuk include logos
cd /var/www/botaxxx/dashboard
npm run build
chown -R www-data:www-data dist
```

#### D. Update Konfigurasi

```bash
# Update API URL di dashboard .env jika domain berubah
nano /var/www/botaxxx/dashboard/.env
# Update VITE_API_BASE_URL jika perlu

# Rebuild frontend
cd /var/www/botaxxx/dashboard
npm run build
```

---

## ✅ Verifikasi

### Step 1: Cek Services

```bash
# Cek status services
sudo systemctl status botaxxx-backend
sudo systemctl status botaxxx-bot
sudo systemctl status nginx

# Cek logs
sudo journalctl -u botaxxx-backend -n 50
sudo journalctl -u botaxxx-bot -n 50
```

### Step 2: Test API

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test maintenance endpoint (public)
curl http://localhost:8000/maintenance

# Test dengan domain/IP
curl http://VPS_BARU_IP/health
```

### Step 3: Test Database

```bash
# Login ke database
sudo -u postgres psql botaxxx_db

# Cek jumlah user
SELECT COUNT(*) FROM users;

# Cek jumlah bank
SELECT COUNT(*) FROM banks;

# Cek jumlah savings
SELECT COUNT(*) FROM savings;

# Exit
\q
```

### Step 4: Test Frontend

1. Buka browser: `http://VPS_BARU_IP` atau `https://domain-baru.com`
2. Login dengan akun yang ada
3. Cek data:
   - ✅ Overview (savings, loans, targets)
   - ✅ Bank accounts
   - ✅ Profile settings

### Step 5: Test Bot

1. Buka Telegram
2. Kirim `/start` ke bot
3. Pastikan bot merespons
4. Test beberapa command

---

## 🔧 Troubleshooting

### Problem: Database Restore Gagal

**Error:** `ERROR: relation already exists`

**Solusi:**
```bash
# Drop database dan buat ulang
sudo -u postgres psql << EOF
DROP DATABASE botaxxx_db;
CREATE DATABASE botaxxx_db;
GRANT ALL PRIVILEGES ON DATABASE botaxxx_db TO botaxxx;
EOF

# Restore lagi
sudo -u postgres psql botaxxx_db < /tmp/botaxxx_db_backup_*.sql
```

### Problem: Migration Error

**Error:** `alembic.util.exc.CommandError: Target database is not up to date`

**Solusi:**
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate

# Cek current revision
alembic current

# Upgrade ke head
alembic upgrade head

# Jika masih error, stamp ke revision terakhir
alembic stamp head
```

### Problem: Backend Tidak Start

**Error:** `ModuleNotFoundError` atau `ImportError`

**Solusi:**
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt

# Fix bcrypt
pip install "bcrypt<4.0.0"

# Restart service
sudo systemctl restart botaxxx-backend
```

### Problem: Frontend Tidak Load

**Error:** Blank page atau 404

**Solusi:**
```bash
# Rebuild frontend
cd /var/www/botaxxx/dashboard
npm install
npm run build

# Set permissions
chown -R www-data:www-data dist

# Reload nginx
sudo systemctl reload nginx
```

### Problem: Bot Tidak Merespons

**Error:** Bot tidak menjawab command

**Solusi:**
```bash
# Cek bot .env
cat /var/www/botaxxx/bot/.env

# Pastikan TELEGRAM_BOT_TOKEN sudah benar
# Restart bot
sudo systemctl restart botaxxx-bot

# Cek logs
sudo journalctl -u botaxxx-bot -f
```

### Problem: Logo Bank Tidak Muncul

**Solusi:**
```bash
# Pastikan logo ada di dist
ls -la /var/www/botaxxx/dashboard/dist/banks/

# Jika tidak ada, copy dari public
cp -r /var/www/botaxxx/dashboard/public/banks/* /var/www/botaxxx/dashboard/dist/banks/

# Set permissions
chown -R www-data:www-data /var/www/botaxxx/dashboard/dist/banks

# Reload nginx
sudo systemctl reload nginx
```

---

## 📝 Checklist Migrasi

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

### Sebelum Migrasi
- [ ] Backup database di VPS lama
- [ ] Backup file .env (backend, bot, dashboard)
- [ ] Backup bank logos
- [ ] Backup deployment_info.txt
- [ ] Download semua backup ke local
- [ ] Verifikasi backup lengkap

### Saat Migrasi
- [ ] Upload backup ke VPS baru
- [ ] Jalankan install script
- [ ] Pilih restore dari backup
- [ ] Tunggu install selesai
- [ ] Restore database (jika otomatis gagal)
- [ ] Restore file .env
- [ ] Restore bank logos
- [ ] Update konfigurasi domain/IP

### Setelah Migrasi
- [ ] Cek status semua services
- [ ] Test API endpoints
- [ ] Test database (jumlah data)
- [ ] Test frontend (login, data)
- [ ] Test bot Telegram
- [ ] Update DNS (jika pakai domain)
- [ ] Test dari browser
- [ ] Inform user tentang downtime

---

## 🔐 Keamanan

### Setelah Migrasi Berhasil:

1. **Hapus backup dari VPS lama** (setelah verifikasi)
   ```bash
   rm -rf /tmp/botaxxx_migration_*
   rm -rf /tmp/botaxxx_db_backup_*
   ```

2. **Hapus backup dari VPS baru** (opsional, simpan untuk cadangan)
   ```bash
   # Simpan di lokasi aman atau hapus
   rm -rf /tmp/botaxxx_migration_*
   ```

3. **Update password** (disarankan)
   - Database password
   - SECRET_KEY di backend
   - Telegram Bot Token (jika perlu)

4. **Setup SSL** (jika belum)
   ```bash
   sudo certbot --nginx
   ```

---

## 📞 Support

Jika mengalami masalah saat migrasi:

1. **Cek logs:**
   ```bash
   # Backend
   sudo journalctl -u botaxxx-backend -n 100
   sudo tail -100 /var/log/botaxxx/backend.error.log
   
   # Bot
   sudo journalctl -u botaxxx-bot -n 100
   sudo tail -100 /var/log/botaxxx/bot.error.log
   
   # Nginx
   sudo tail -100 /var/log/nginx/error.log
   ```

2. **Cek deployment info:**
   ```bash
   cat /var/www/botaxxx/deployment_info.txt
   ```

3. **Cek database:**
   ```bash
   sudo -u postgres psql botaxxx_db -c "\dt"  # List tables
   sudo -u postgres psql botaxxx_db -c "SELECT COUNT(*) FROM users;"  # Count users
   ```

---

## 🎉 Selesai!

Setelah semua langkah selesai dan verifikasi berhasil, migrasi VPS sudah selesai. Data user dan semua informasi penting sudah tersimpan di VPS baru.

**Tips:**
- Simpan backup di lokasi aman (cloud storage) sebagai cadangan
- Dokumentasikan password dan konfigurasi penting
- Test semua fitur setelah migrasi
- Monitor logs selama 24 jam pertama

---

**Terakhir diupdate:** $(date +%Y-%m-%d)

