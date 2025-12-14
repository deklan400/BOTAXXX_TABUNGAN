# 🔄 Langkah Update VPS - Fix Sidebar Collapsed State

Update untuk memperbaiki sidebar agar state collapsed tetap dipertahankan di semua halaman termasuk admin.

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
- [ ] Test sidebar collapse di halaman non-admin
- [ ] Test sidebar collapse di halaman admin (state tetap dipertahankan)

---

## 🧪 Testing

Setelah update, test fitur berikut:

1. **Test Sidebar Collapse di Halaman Non-Admin:**
   - Buka halaman Financial Overview (Statistics)
   - Klik tombol collapse sidebar (chevron)
   - Sidebar harus collapse

2. **Test Sidebar State Persistence:**
   - Dengan sidebar collapsed, navigasi ke halaman admin (Admin Dashboard)
   - Sidebar harus tetap collapsed (tidak auto-expand)
   - Navigasi ke halaman lain (User Management, Role Management, dll)
   - Sidebar harus tetap collapsed di semua halaman

3. **Test Sidebar Expand:**
   - Klik tombol expand sidebar
   - Sidebar harus expand
   - Navigasi ke halaman lain
   - Sidebar harus tetap expanded

4. **Test Refresh Page:**
   - Collapse sidebar
   - Refresh halaman (F5)
   - Sidebar harus tetap collapsed setelah refresh

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

### Sidebar masih auto-expand di admin route
```bash
# Clear browser cache dan localStorage
# Tekan F12 → Application → Local Storage → Clear All
# Atau gunakan Incognito/Private mode untuk test
```

---

## 📝 Catatan

- **PENTING:** Selalu aktifkan virtual environment sebelum `pip install`!
- Pastikan semua file memiliki permission yang benar (`www-data:www-data`)
- Setelah update, selalu verifikasi status services
- Test fitur yang diupdate untuk memastikan berfungsi dengan baik
- Jika sidebar masih tidak berfungsi, clear browser cache dan localStorage

---

**Update selesai!** 🎉

