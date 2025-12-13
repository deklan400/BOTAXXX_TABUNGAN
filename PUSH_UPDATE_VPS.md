# 🚀 Panduan Push Update ke VPS

Panduan lengkap untuk mengupdate aplikasi BOTAXXX di VPS yang sudah terdeploy dengan perubahan terbaru dari GitHub.

---

## 📋 Prasyarat

1. **Akses SSH ke VPS**
2. **Akses root/sudo di VPS**
3. **Perubahan sudah di-push ke GitHub** (branch `main`)

---

## 🔄 Metode 1: Menggunakan Script Update Otomatis (Recommended)

### Langkah 1: Login ke VPS

```bash
ssh root@VPS_IP
# atau
ssh user@VPS_IP
sudo su
```

### Langkah 2: Download Script Update (jika belum ada)

```bash
cd /var/www/botaxxx
# Script sudah ada di repository, langsung gunakan
```

### Langkah 3: Jalankan Script Update

```bash
cd /var/www/botaxxx
sudo bash update-vps.sh
```

Script ini akan otomatis:
- ✅ Pull perubahan terbaru dari GitHub
- ✅ Update dependencies backend
- ✅ Run database migrations
- ✅ Rebuild frontend
- ✅ Update dependencies bot
- ✅ Restart semua services
- ✅ Check status services

---

## 🔧 Metode 2: Update Manual (Step by Step)

Jika ingin melakukan update secara manual atau ada masalah dengan script:

### Langkah 1: Login ke VPS

```bash
ssh root@VPS_IP
# atau
ssh user@VPS_IP
sudo su
```

### Langkah 2: Masuk ke Direktori Aplikasi

```bash
cd /var/www/botaxxx
```

### Langkah 3: Pull Perubahan dari GitHub

```bash
git pull origin main
chown -R www-data:www-data /var/www/botaxxx
```

### Langkah 4: Update Backend

```bash
cd /var/www/botaxxx/backend
source venv/bin/activate

# Update dependencies (jika ada perubahan requirements.txt)
pip install -r requirements.txt --quiet

# Run migrations (jika ada perubahan database)
alembic upgrade head
```

### Langkah 5: Rebuild Frontend

```bash
cd /var/www/botaxxx/dashboard
npm install --silent
npm run build
chown -R www-data:www-data /var/www/botaxxx/dashboard/dist
```

### Langkah 6: Update Bot (jika ada perubahan)

```bash
cd /var/www/botaxxx/bot
source venv/bin/activate
pip install -r requirements.txt --quiet
```

### Langkah 7: Restart Services

```bash
# Restart backend
systemctl restart botaxxx-backend

# Restart bot
systemctl restart botaxxx-bot

# Reload Nginx (untuk frontend)
systemctl reload nginx
```

### Langkah 8: Verifikasi Services Berjalan

```bash
# Check status semua services
systemctl status botaxxx-backend
systemctl status botaxxx-bot
systemctl status nginx

# Atau check sekaligus
systemctl status botaxxx-backend botaxxx-bot nginx
```

### Langkah 9: Check Logs (jika ada masalah)

```bash
# Backend logs
journalctl -u botaxxx-backend -n 50 --no-pager

# Bot logs
journalctl -u botaxxx-bot -n 50 --no-pager

# Follow logs real-time
journalctl -u botaxxx-backend -f
```

---

## 🔍 Troubleshooting

### Masalah: Git Pull Gagal

```bash
# Check status git
cd /var/www/botaxxx
git status

# Jika ada konflik, backup dulu
cp -r /var/www/botaxxx /var/www/botaxxx.backup

# Reset ke remote (HATI-HATI: ini akan menghapus perubahan lokal)
git fetch origin
git reset --hard origin/main
```

### Masalah: Backend Tidak Start

```bash
# Check logs
journalctl -u botaxxx-backend -n 100 --no-pager

# Check apakah port 8000 sudah digunakan
netstat -tulpn | grep 8000

# Restart manual
cd /var/www/botaxxx/backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Masalah: Frontend Tidak Update

```bash
# Pastikan build berhasil
cd /var/www/botaxxx/dashboard
npm run build

# Check file dist
ls -la /var/www/botaxxx/dashboard/dist

# Clear browser cache atau hard refresh (Ctrl+Shift+R)
```

### Masalah: Database Migration Error

```bash
# Check migration status
cd /var/www/botaxxx/backend
source venv/bin/activate
alembic current
alembic history

# Rollback jika perlu (HATI-HATI)
alembic downgrade -1

# Atau upgrade ke head
alembic upgrade head
```

### Masalah: Permission Error

```bash
# Fix permissions
chown -R www-data:www-data /var/www/botaxxx
chmod -R 755 /var/www/botaxxx
```

---

## 📝 Checklist Update

Sebelum dan sesudah update, pastikan:

- [ ] Perubahan sudah di-push ke GitHub (branch `main`)
- [ ] Backup database (opsional tapi disarankan)
- [ ] Login ke VPS dengan akses root/sudo
- [ ] Pull perubahan dari GitHub
- [ ] Update dependencies (backend & bot)
- [ ] Run database migrations (jika ada)
- [ ] Rebuild frontend
- [ ] Restart services
- [ ] Verifikasi services berjalan
- [ ] Test aplikasi di browser
- [ ] Check logs jika ada error

---

## 🎯 Quick Command Reference

```bash
# Update cepat (menggunakan script)
cd /var/www/botaxxx && sudo bash update-vps.sh

# Update manual - pull & restart
cd /var/www/botaxxx && git pull origin main && \
cd backend && source venv/bin/activate && alembic upgrade head && \
cd ../dashboard && npm run build && \
systemctl restart botaxxx-backend botaxxx-bot && systemctl reload nginx

# Check status
systemctl status botaxxx-backend botaxxx-bot

# View logs
journalctl -u botaxxx-backend -f
journalctl -u botaxxx-bot -f

# Rebuild frontend saja
cd /var/www/botaxxx/dashboard && npm run build && systemctl reload nginx
```

---

## ⚠️ Catatan Penting

1. **Backup Database**: Sebelum update besar, disarankan backup database:
   ```bash
   sudo -u postgres pg_dump botaxxx_db > /tmp/backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Downtime**: Update biasanya memakan waktu 2-5 menit. Aplikasi akan down selama restart services.

3. **Test di Staging**: Jika memungkinkan, test dulu di environment staging sebelum production.

4. **Monitor Logs**: Setelah update, monitor logs selama beberapa menit untuk memastikan tidak ada error.

5. **Rollback**: Jika ada masalah, bisa rollback dengan:
   ```bash
   cd /var/www/botaxxx
   git log --oneline -5  # Lihat commit sebelumnya
   git checkout <commit-hash>  # Kembali ke commit sebelumnya
   # Lalu restart services
   ```

---

## 📞 Support

Jika ada masalah yang tidak bisa diselesaikan:

1. Check logs: `journalctl -u botaxxx-backend -n 100`
2. Check GitHub issues
3. Hubungi developer/maintainer

---

**Last Updated**: $(date +%Y-%m-%d)

