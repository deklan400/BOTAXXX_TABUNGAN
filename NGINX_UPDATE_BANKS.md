# Update Nginx Config untuk Route /banks

## Masalah
Route `/banks` tidak di-proxy ke backend, sehingga return HTML (frontend) bukan JSON (API).

## Solusi

Edit nginx config di VPS:

```bash
sudo nano /etc/nginx/sites-available/botaxxx
```

Cari bagian:
```nginx
location ~ ^/(auth|users|overview|savings|loans|targets|health|docs) {
```

Ubah menjadi:
```nginx
location ~ ^/(auth|users|overview|savings|loans|targets|banks|health|docs) {
```

Atau jika menggunakan IP address (bukan domain), pastikan ada location block untuk API routes:

```nginx
server {
    listen 80;
    server_name YOUR_IP_OR_DOMAIN;

    # Dashboard
    location / {
        root /var/www/botaxxx/dashboard/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API routes
    location ~ ^/(auth|users|overview|savings|loans|targets|banks|health|docs) {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Setelah Update

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Verifikasi

Test API endpoint:
```bash
curl http://127.0.0.1:8000/banks/banks | head -20
```

Harusnya return JSON, bukan HTML.

