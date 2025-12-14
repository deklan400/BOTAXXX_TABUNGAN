# 🔄 Langkah Update VPS - Fix Bank Card Color

Update untuk memperbaiki warna kartu rekening bank agar menggunakan brand_color dari setting admin.

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

### 7. Restart Services

```bash
cd /var/www/botaxxx
sudo systemctl restart botaxxx-backend
sudo systemctl reload nginx
```

### 8. Verifikasi Services

```bash
sudo systemctl status botaxxx-backend nginx
```

Pastikan semua service status menunjukkan `active (running)`.

---

## ✅ Checklist

- [ ] Git pull berhasil
- [ ] Backend dependencies terupdate (dengan venv aktif)
- [ ] Frontend build berhasil
- [ ] Semua services restart dan running
- [ ] Test kartu rekening bank menampilkan warna sesuai brand_color

---

## 🧪 Testing

Setelah update, test fitur berikut:

1. **Test Bank Card Color:**
   - Buka halaman Rekening Bank
   - Pastikan kartu rekening bank menampilkan warna sesuai brand_color yang di-set admin
   - Jika admin sudah set brand_color untuk bank tertentu, kartu harus menampilkan warna tersebut
   - Jika brand_color tidak di-set, kartu akan menggunakan warna default biru (#0066CC)

2. **Test dengan Berbagai Bank:**
   - Cek kartu BCA (jika brand_color di-set)
   - Cek kartu Mandiri (jika brand_color di-set)
   - Cek kartu bank lain yang sudah di-set brand_color-nya

3. **Test Admin Settings:**
   - Login sebagai admin
   - Buka Bank Management
   - Edit bank dan set brand_color (contoh: #E31837 untuk merah)
   - Kembali ke halaman Rekening Bank
   - Kartu harus menampilkan warna yang baru di-set

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

# Restart manual
sudo systemctl restart botaxxx-backend
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

### Kartu masih menampilkan warna kuning/hijau
```bash
# 1. Pastikan frontend sudah di-build ulang
cd /var/www/botaxxx/dashboard
npm run build

# 2. Clear browser cache
# Tekan Ctrl+Shift+R atau gunakan Incognito mode

# 3. Restart backend untuk memastikan eager loading bekerja
sudo systemctl restart botaxxx-backend

# 4. Cek apakah brand_color tersedia di response API
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/banks/accounts
```

### Brand color tidak muncul di kartu
```bash
# 1. Cek apakah bank sudah punya brand_color di database
# Login ke database
sudo -u postgres psql -d botaxxx_db

# Cek brand_color
SELECT id, name, brand_color FROM banks WHERE name = 'BCA';

# Jika brand_color NULL, set via admin panel atau langsung di database:
UPDATE banks SET brand_color = '#0066CC' WHERE name = 'BCA';

# 2. Pastikan eager loading bekerja dengan cek log backend
sudo journalctl -u botaxxx-backend -n 100 | grep -i "bank"
```

---

## 📝 Catatan Penting

- **PENTING:** Selalu aktifkan virtual environment sebelum `pip install`!
- **PENTING:** Setelah update, clear browser cache atau gunakan Incognito mode untuk melihat perubahan
- Pastikan semua file memiliki permission yang benar (`www-data:www-data`)
- Setelah update, selalu verifikasi status services
- Test fitur yang diupdate untuk memastikan berfungsi dengan baik
- Brand color harus di-set via admin panel di Bank Management untuk setiap bank

---

## 🎨 Cara Set Brand Color via Admin

1. Login sebagai admin
2. Buka menu **Bank Management**
3. Klik bank yang ingin di-edit
4. Di bagian **Settings**, set **Brand Color** (format hex: #0066CC)
5. Klik **Save Settings**
6. Kembali ke halaman **Rekening Bank** untuk melihat perubahan

---

**Update selesai!** 🎉

