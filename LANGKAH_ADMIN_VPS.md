# Langkah-Langkah Setup Admin Dashboard di VPS

## Step 1: SSH ke VPS
```bash
ssh root@YOUR_VPS_IP
```

## Step 2: Pull Update dari GitHub
```bash
cd /var/www/botaxxx
git pull origin main
```

## Step 3: Update Backend Dependencies
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
pip install -r requirements.txt --quiet
```

## Step 4: Run Database Migration
```bash
# Masih di folder backend
alembic upgrade head
```

Ini akan menambahkan field `role` dan `is_active` ke table `users`.

## Step 5: Set User Jadi Admin
```bash
# Masih di folder backend, venv masih aktif
python app/db/set_admin.py your-email@example.com
```

Ganti `your-email@example.com` dengan email user yang mau jadi admin.

Contoh:
```bash
python app/db/set_admin.py fadlan400@gmail.com
```

Output harusnya:
```
✅ User 'fadlan400@gmail.com' is now an admin!
   Name: Alan13090
   Email: fadlan400@gmail.com
   Role: admin
```

## Step 6: Restart Backend Service
```bash
systemctl restart botaxxx-backend
```

## Step 7: Update Frontend
```bash
cd /var/www/botaxxx/dashboard
npm install
npm run build
chown -R www-data:www-data dist
```

## Step 8: Reload Nginx
```bash
systemctl reload nginx
```

## Step 9: Update Nginx Config (Jika Perlu)

Pastikan route `/admin` di-proxy ke backend:

```bash
sudo nano /etc/nginx/sites-available/botaxxx
```

Cari bagian:
```nginx
location ~ ^/(docs|openapi.json|health|auth|users|overview|savings|loans|targets|banks/banks|banks/accounts) {
```

Ubah menjadi (tambahkan `admin`):
```nginx
location ~ ^/(docs|openapi.json|health|auth|users|overview|savings|loans|targets|banks/banks|banks/accounts|admin) {
```

Test dan reload:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 10: Verifikasi

1. **Test Backend API:**
```bash
# Login dulu untuk dapat token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"fadlan400@gmail.com","password":"yourpassword"}'

# Test admin endpoint dengan token
curl -X GET http://localhost:8000/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Harusnya return JSON dengan stats, bukan 403 Forbidden.

2. **Test di Browser:**
   - Login dengan email yang sudah di-set jadi admin
   - Harusnya muncul menu "Admin" di sidebar (warna ungu)
   - Klik "Admin Dashboard" untuk akses dashboard admin

## Troubleshooting

### User tidak muncul sebagai admin?
- Pastikan migration sudah jalan: `alembic upgrade head`
- Pastikan script set_admin berhasil: `python app/db/set_admin.py email@example.com`
- Cek di database:
  ```bash
  sudo -u postgres psql botaxxx_db
  SELECT id, name, email, role, is_active FROM users WHERE email='your-email@example.com';
  ```

### Menu admin tidak muncul di sidebar?
- Pastikan user sudah login
- Pastikan `user.role === 'admin'` (cek di browser console: `localStorage.getItem('token')` lalu decode JWT)
- Clear browser cache dan hard refresh (Ctrl+Shift+R)

### 403 Forbidden saat akses `/admin/*`?
- Pastikan user role sudah 'admin' di database
- Pastikan token JWT masih valid
- Cek backend logs: `journalctl -u botaxxx-backend -n 50`

### Frontend tidak update?
- Pastikan `npm run build` sudah jalan
- Pastikan `chown -R www-data:www-data dist` sudah dijalankan
- Clear browser cache

## Selesai!

Setelah semua langkah, admin dashboard akan muncul untuk user yang role-nya 'admin'! 🎉

