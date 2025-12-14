# 🔄 Langkah Update VPS - Bot Rekening Bank

Update untuk menambahkan menu Rekening Bank di Telegram bot dengan logo bank.

---

## 📋 Langkah-Langkah Update

### 1. Login ke VPS

```bash
ssh root@VPS_IP
# atau
ssh user@VPS_IP
```

### 2. Masuk ke Direktori Aplikasi

```bash
cd /var/www/botaxxx
```

### 3. Pull Perubahan dari GitHub

```bash
git pull origin main
chown -R www-data:www-data /var/www/botaxxx
```

### 4. Update Backend (PENTING: Aktifkan Virtual Environment!)

```bash
cd backend
source venv/bin/activate  # ← INI PENTING! Jangan lupa!
pip install -r requirements.txt
```

### 5. Run Migrations (jika ada perubahan database)

```bash
alembic upgrade head
```

### 6. Build Frontend (PENTING: Logo bank harus di-copy ke dist!)

```bash
cd ../dashboard
npm install
npm run build
chown -R www-data:www-data /var/www/botaxxx/dashboard/dist
```

**PENTING:** Pastikan logo bank ada di `dashboard/public/banks/` dan akan otomatis di-copy ke `dist/banks/` saat build.

### 7. Update Bot (PENTING: Aktifkan Virtual Environment!)

```bash
cd ../bot
source venv/bin/activate  # ← INI PENTING! Jangan lupa!
pip install -r requirements.txt
```

### 8. Konfigurasi Environment Bot (Opsional)

Jika domain publik berbeda dengan API_BASE_URL, tambahkan PUBLIC_URL di `.env` bot:

```bash
cd /var/www/botaxxx/bot
nano .env
```

Tambahkan (jika belum ada):
```env
PUBLIC_URL=https://yourdomain.com
# atau
PUBLIC_URL=http://YOUR_IP
```

**Catatan:** Jika tidak di-set, akan menggunakan API_BASE_URL (default: http://localhost:8000)

### 9. Restart Services

```bash
cd /var/www/botaxxx
sudo systemctl restart botaxxx-backend
sudo systemctl restart botaxxx-bot
sudo systemctl reload nginx
```

### 10. Verifikasi Services

```bash
sudo systemctl status botaxxx-backend botaxxx-bot nginx
```

Pastikan semua service status menunjukkan `active (running)`.

---

## ✅ Checklist

- [ ] Git pull berhasil
- [ ] Backend dependencies terupdate (dengan venv aktif)
- [ ] Frontend build berhasil (logo bank ter-copy ke dist)
- [ ] Bot dependencies terupdate (dengan venv aktif)
- [ ] PUBLIC_URL dikonfigurasi (jika diperlukan)
- [ ] Semua services restart dan running
- [ ] Test menu Rekening Bank di bot
- [ ] Test logo bank tampil dengan benar

---

## 🧪 Testing

Setelah update, test fitur berikut di Telegram bot:

1. **Test Menu Rekening Bank:**
   - Buka bot di Telegram
   - Klik menu "🏦 Rekening Bank"
   - Menu harus muncul dengan opsi "List Rekening Bank"

2. **Test List Rekening Bank:**
   - Klik "List Rekening Bank"
   - Bot harus menampilkan semua rekening bank
   - Setiap rekening harus menampilkan:
     - Logo bank (jika tersedia)
     - Nama bank
     - Nama pemilik rekening
     - Nomor rekening
     - Saldo

3. **Test Logo Bank:**
   - Pastikan logo bank tampil sebagai foto di Telegram
   - Jika logo tidak muncul, cek:
     - Logo file ada di `dashboard/public/banks/`
     - Frontend sudah di-build
     - URL logo bisa diakses (curl test)

---

## 🚨 Troubleshooting

### Error: "externally-managed-environment"
```bash
# Pastikan virtual environment aktif!
cd /var/www/botaxxx/bot
source venv/bin/activate
pip install -r requirements.txt
```

### Error: Logo tidak muncul di bot
```bash
# 1. Cek logo file ada
ls -la /var/www/botaxxx/dashboard/public/banks/

# 2. Cek logo ter-copy ke dist
ls -la /var/www/botaxxx/dashboard/dist/banks/

# 3. Test URL logo bisa diakses
curl -I http://localhost/banks/bca.png
# atau
curl -I http://YOUR_IP/banks/bca.png

# 4. Pastikan Nginx serve static files
grep -A 5 "location.*banks" /etc/nginx/sites-available/botaxxx

# 5. Rebuild frontend jika logo tidak ter-copy
cd /var/www/botaxxx/dashboard
rm -rf dist
npm run build
chown -R www-data:www-data /var/www/botaxxx/dashboard/dist
sudo systemctl reload nginx
```

### Error: Bot tidak merespon menu Rekening Bank
```bash
# Cek log bot
sudo journalctl -u botaxxx-bot -n 50

# Restart bot
sudo systemctl restart botaxxx-bot

# Cek status bot
sudo systemctl status botaxxx-bot
```

### Error: "Not authenticated" saat akses menu
```bash
# Pastikan user sudah login via /start
# Cek token di state_manager
# Restart bot jika perlu
sudo systemctl restart botaxxx-bot
```

### Logo URL tidak benar
```bash
# Edit .env bot
cd /var/www/botaxxx/bot
nano .env

# Tambahkan PUBLIC_URL dengan domain publik
PUBLIC_URL=https://yourdomain.com

# Restart bot
sudo systemctl restart botaxxx-bot
```

---

## 📝 Catatan Penting

- **PENTING:** Selalu aktifkan virtual environment sebelum `pip install`!
- **PENTING:** Logo bank harus ada di `dashboard/public/banks/` dan akan otomatis di-copy ke `dist/banks/` saat build
- **PENTING:** Set `PUBLIC_URL` di `.env` bot jika domain publik berbeda dengan API_BASE_URL
- Pastikan semua file memiliki permission yang benar (`www-data:www-data`)
- Setelah update, selalu verifikasi status services
- Test fitur yang diupdate untuk memastikan berfungsi dengan baik
- Logo harus bisa diakses dari internet (tidak hanya localhost) agar bot bisa mengirimnya ke Telegram

---

## 🔍 Verifikasi Logo Bank

### Cek Logo File
```bash
# Cek logo di public
ls -la /var/www/botaxxx/dashboard/public/banks/

# Cek logo di dist (setelah build)
ls -la /var/www/botaxxx/dashboard/dist/banks/
```

### Test URL Logo
```bash
# Test dari server
curl -I http://localhost/banks/bca.png

# Test dari luar (ganti dengan IP/domain Anda)
curl -I http://YOUR_IP/banks/bca.png
```

### Cek Nginx Config
```bash
# Pastikan ada location block untuk /banks/
grep -A 5 "location.*banks" /etc/nginx/sites-available/botaxxx
```

Jika tidak ada, tambahkan di Nginx config:
```nginx
# Serve static bank logos (must be before API routes)
location ~ ^/banks/.*\.(png|jpg|jpeg|svg|gif|webp)$ {
    root /var/www/botaxxx/dashboard/dist;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

**Update selesai!** 🎉

