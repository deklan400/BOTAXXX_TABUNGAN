# 🔧 Langkah Update VPS - Fix Role Management

Panduan cepat untuk update VPS setelah fix fungsi Role Management.

---

## ⚡ Quick Update (Copy-Paste)

```bash
# 1. Masuk ke VPS
ssh root@159.195.13.157

# 2. Masuk ke direktori aplikasi
cd /var/www/botaxxx

# 3. Pull perubahan
git pull origin main

# 4. Update Backend (PENTING: Aktifkan virtual environment dulu!)
cd backend
source venv/bin/activate  # ← INI PENTING!
pip install -r requirements.txt

# 5. Run migrations (jika ada)
alembic upgrade head

# 6. Build Frontend
cd ../dashboard
npm install
npm run build

# 7. Restart Services
cd ..
sudo systemctl restart botaxxx-backend
sudo systemctl restart nginx

# 8. Check Status
sudo systemctl status botaxxx-backend
```

---

## 📝 Penjelasan

### ⚠️ Error "externally-managed-environment"

Jika muncul error seperti ini:
```
error: externally-managed-environment
```

**Solusi:** Pastikan Anda sudah mengaktifkan virtual environment sebelum menjalankan `pip install`:

```bash
cd /var/www/botaxxx/backend
source venv/bin/activate  # ← WAJIB!
pip install -r requirements.txt
```

Setelah mengaktifkan virtual environment, prompt terminal akan berubah menjadi:
```
(venv) root@vps:/var/www/botaxxx/backend#
```

---

## ✅ Verifikasi

Setelah update, test fungsi Role Management:

1. Buka browser: `http://159.195.13.157/admin/roles`
2. Login sebagai admin
3. Test fungsi:
   - Klik "Naikkan" pada user → harus berhasil naikkan ke admin
   - Klik "Turunkan" pada admin → harus berhasil turunkan ke user
   - Pastikan tidak ada error message

---

## 🐛 Troubleshooting

### Virtual environment tidak ada?

Jika folder `venv` tidak ada di `backend/`:

```bash
cd /var/www/botaxxx/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Service tidak restart?

```bash
# Check log
sudo journalctl -u botaxxx-backend -n 50

# Restart manual
sudo systemctl restart botaxxx-backend
sudo systemctl restart nginx
```

---

## 📌 Catatan

- **Selalu aktifkan virtual environment** sebelum `pip install`
- Jika ada perubahan `requirements.txt`, jalankan `pip install -r requirements.txt`
- Jika ada perubahan database schema, jalankan `alembic upgrade head`
- Setelah update frontend, selalu jalankan `npm run build`

