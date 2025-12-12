# Fix Delete User - Method Not Allowed

## Masalah
Error "Method Not Allowed" saat mencoba menghapus user. Ini terjadi karena backend belum di-restart setelah perubahan kode.

## Solusi

### 1. Pull Update dari GitHub
```bash
cd /var/www/botaxxx
git pull origin main
```

### 2. Restart Backend Service
```bash
sudo systemctl restart botaxxx-backend
```

### 3. Verifikasi Backend Running
```bash
sudo systemctl status botaxxx-backend
```

Harusnya status: `active (running)`

### 4. Test Endpoint DELETE (Opsional)
```bash
# Test langsung ke backend (localhost)
curl -X DELETE http://localhost:8000/admin/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

Jika return `{"detail":"Cannot delete yourself"}` atau `{"detail":"User not found"}`, berarti endpoint sudah bekerja (hanya perlu token yang valid).

### 5. Reload Nginx (Jika Perlu)
```bash
sudo nginx -t  # Test config
sudo systemctl reload nginx
```

## Verifikasi di Dashboard

1. Login sebagai admin
2. Buka menu "User Management"
3. Klik tombol "Hapus" pada user yang ingin dihapus
4. Konfirmasi di modal
5. User harus terhapus tanpa error "Method Not Allowed"

## Troubleshooting

### Jika masih error "Method Not Allowed":

1. **Cek backend logs:**
```bash
sudo tail -f /var/log/botaxxx/backend.log
```

2. **Cek apakah endpoint terdaftar:**
```bash
curl http://localhost:8000/docs
```
Buka di browser dan cek apakah endpoint `DELETE /admin/users/{user_id}` ada di dokumentasi.

3. **Cek Nginx config:**
```bash
sudo cat /etc/nginx/sites-available/botaxxx | grep admin
```
Harusnya ada `/admin` di regex pattern untuk API routes.

4. **Restart semua service:**
```bash
sudo systemctl restart botaxxx-backend
sudo systemctl reload nginx
```

