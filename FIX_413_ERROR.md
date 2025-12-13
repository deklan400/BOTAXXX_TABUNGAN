# Fix Error 413 - Payload Too Large

Error 413 terjadi karena file upload melebihi batas yang diizinkan server. Perlu update konfigurasi Nginx dan backend.

## 🔧 SOLUSI CEPAT - Copy Paste Langsung

### 1. Update Nginx Configuration

```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/botaxxx
# atau
sudo nano /etc/nginx/nginx.conf

# Tambahkan atau update baris ini di dalam block server atau http:
client_max_body_size 10M;

# Test konfigurasi
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### 2. Update Nginx Config Lengkap (Contoh)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # INI YANG PENTING - Tambahkan baris ini
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Serve static files untuk avatars
    location /avatars/ {
        alias /var/www/botaxxx/dashboard/public/avatars/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Jika Menggunakan Uvicorn/Gunicorn, Cek Limit

```bash
# Cek apakah ada limit di systemd service
sudo nano /etc/systemd/system/botaxxx-backend.service
```

Pastikan tidak ada limit di service file. Jika ada, hapus atau tingkatkan.

### 4. Restart Semua Service

```bash
sudo systemctl restart nginx
sudo systemctl restart botaxxx-backend
```

## 📋 LANGKAH DETAIL

### Langkah 1: Cek File Nginx Config

```bash
# Cari file config nginx
ls -la /etc/nginx/sites-available/
# atau
ls -la /etc/nginx/conf.d/

# Edit file config yang digunakan
sudo nano /etc/nginx/sites-available/botaxxx
```

### Langkah 2: Tambahkan client_max_body_size

Di dalam block `server` atau `http`, tambahkan:

```nginx
client_max_body_size 10M;  # Atau 20M jika perlu lebih besar
```

**PENTING:** 
- Letakkan di dalam block `server` untuk spesifik site
- Atau di dalam block `http` untuk global
- Nilai bisa disesuaikan: `10M`, `20M`, `50M`, dll

### Langkah 3: Test dan Restart

```bash
# Test konfigurasi nginx
sudo nginx -t

# Jika sukses, restart
sudo systemctl restart nginx

# Cek status
sudo systemctl status nginx
```

### Langkah 4: Cek Backend Limit (Jika Masih Error)

Jika masih error setelah update nginx, cek backend:

```bash
# Cek service file backend
sudo nano /etc/systemd/system/botaxxx-backend.service
```

Pastikan tidak ada limit seperti:
- `LimitRequestBody=0` (hapus jika ada)
- Atau set ke nilai yang lebih besar

### Langkah 5: Restart Backend

```bash
sudo systemctl daemon-reload
sudo systemctl restart botaxxx-backend
```

## 🔍 TROUBLESHOOTING

### Jika Masih Error 413:

1. **Cek ukuran file yang diupload:**
```bash
# Di local, cek ukuran file
ls -lh nama_file.png
```

2. **Cek nginx error log:**
```bash
sudo tail -f /var/log/nginx/error.log
```

3. **Cek apakah config sudah ter-apply:**
```bash
# Test config
sudo nginx -t

# Reload config (tanpa restart)
sudo nginx -s reload
```

4. **Cek multiple nginx config:**
```bash
# Cek semua config file
grep -r "client_max_body_size" /etc/nginx/

# Pastikan tidak ada config yang override dengan nilai lebih kecil
```

### Jika Error Berbeda:

- **Error 502/503:** Backend tidak running atau error
- **Error 500:** Error di aplikasi backend (cek log backend)
- **Error 404:** Route tidak ditemukan
- **Error 413:** File terlalu besar (yang sedang kita fix)

## ✅ VERIFIKASI

Setelah update, test lagi:

1. Buka Settings page
2. Upload file avatar (pastikan < 10MB)
3. Klik "Update Profile"
4. Seharusnya tidak ada error 413 lagi

## 📝 CONTOH CONFIG LENGKAP

```nginx
# /etc/nginx/sites-available/botaxxx

upstream backend {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    # INI YANG PENTING
    client_max_body_size 10M;
    
    # Logging
    access_log /var/log/nginx/botaxxx_access.log;
    error_log /var/log/nginx/botaxxx_error.log;
    
    # Proxy to backend
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout untuk upload besar
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # Serve static files - avatars
    location /avatars/ {
        alias /var/www/botaxxx/dashboard/public/avatars/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # Serve static files - frontend build
    location /static/ {
        alias /var/www/botaxxx/dashboard/dist/;
        expires 30d;
    }
}
```

## 🚀 SCRIPT CEPAT (Copy Paste Semua)

```bash
#!/bin/bash

echo "Fixing 413 Error - Payload Too Large"

# 1. Backup nginx config
sudo cp /etc/nginx/sites-available/botaxxx /etc/nginx/sites-available/botaxxx.backup.$(date +%Y%m%d_%H%M%S)

# 2. Edit nginx config (gunakan editor favorit Anda)
echo "Edit nginx config dan tambahkan: client_max_body_size 10M;"
echo "Tekan Enter untuk lanjut..."
read

# 3. Test config
sudo nginx -t

# 4. Restart nginx
sudo systemctl restart nginx

# 5. Restart backend
sudo systemctl restart botaxxx-backend

# 6. Cek status
echo "Checking services..."
sudo systemctl status nginx --no-pager
sudo systemctl status botaxxx-backend --no-pager

echo "Done! Test upload avatar lagi."
```

