# 🔄 Langkah Update VPS - Fix Maintenance Mode

Update untuk memperbaiki maintenance mode agar admin tetap bisa login dan mengakses aplikasi.

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

### 6. Build Frontend

```bash
cd ../dashboard
npm install
npm run build
chown -R www-data:www-data /var/www/botaxxx/dashboard/dist
```

### 7. Update Bot (jika ada perubahan)

```bash
cd ../bot
source venv/bin/activate
pip install -r requirements.txt
```

### 8. Restart Services

```bash
cd /var/www/botaxxx
sudo systemctl restart botaxxx-backend
sudo systemctl restart botaxxx-bot
sudo systemctl reload nginx
```

### 9. Verifikasi Services

```bash
sudo systemctl status botaxxx-backend botaxxx-bot nginx
```

Pastikan semua service status menunjukkan `active (running)`.

---

## ✅ Checklist

- [ ] Git pull berhasil
- [ ] Backend dependencies terupdate (dengan venv aktif)
- [ ] Frontend build berhasil
- [ ] Bot dependencies terupdate (jika ada)
- [ ] Semua services restart dan running
- [ ] Test login admin saat maintenance mode aktif

---

## 🧪 Testing

Setelah update, test fitur berikut:

1. **Test Maintenance Mode:**
   - Login sebagai admin
   - Aktifkan maintenance mode di `/admin/maintenance`
   - Logout
   - Coba login sebagai admin → **Harus bisa login**
   - Coba login sebagai user biasa → **Harus diblokir**

2. **Test Normal Mode:**
   - Nonaktifkan maintenance mode
   - Login sebagai user biasa → **Harus bisa login**

---

## 🚨 Troubleshooting

### Error: "externally-managed-environment"
```bash
# Pastikan virtual environment aktif!
cd /var/www/botaxxx/backend
source venv/bin/activate
pip install -r requirements.txt
```

### Error: Service tidak restart
```bash
# Cek log error
sudo journalctl -u botaxxx-backend -n 50
sudo journalctl -u botaxxx-bot -n 50

# Restart manual
sudo systemctl restart botaxxx-backend
sudo systemctl restart botaxxx-bot
```

### Error: Frontend tidak update
```bash
# Clear cache dan rebuild
cd /var/www/botaxxx/dashboard
rm -rf node_modules dist
npm install
npm run build
chown -R www-data:www-data /var/www/botaxxx/dashboard/dist
sudo systemctl reload nginx
```

---

## 📝 Catatan

- **PENTING:** Selalu aktifkan virtual environment sebelum `pip install`!
- Pastikan semua file memiliki permission yang benar (`www-data:www-data`)
- Setelah update, selalu verifikasi status services
- Test fitur yang diupdate untuk memastikan berfungsi dengan baik

---

**Update selesai!** 🎉

