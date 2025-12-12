# Fix Nginx Config untuk Logo Bank

## Masalah
Request ke `/banks/bca.png` di-proxy ke backend API (return JSON `{"detail":"Not Found"}`), bukan di-serve sebagai static file.

## Solusi

Edit Nginx config di VPS:

```bash
sudo nano /etc/nginx/sites-available/botaxxx
```

Cari bagian yang seperti ini:
```nginx
location ~ ^/(docs|openapi.json|health|auth|users|overview|savings|loans|targets|banks) {
    proxy_pass http://127.0.0.1:8000;
    ...
}
```

**UBAH MENJADI** (lebih spesifik untuk API routes, exclude static files):

```nginx
# Serve static bank logos FIRST (before API routes)
location ~ ^/banks/.*\.(png|jpg|jpeg|svg|gif|webp)$ {
    root /var/www/botaxxx/dashboard/dist;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# Backend API routes (specific paths only)
location ~ ^/(docs|openapi.json|health|auth|users|overview|savings|loans|targets|banks/banks|banks/accounts) {
    proxy_pass http://127.0.0.1:8000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**PENTING:** Location block untuk static files (`/banks/.*\.(png|...)`) HARUS diletakkan SEBELUM location block untuk API routes, karena Nginx match dari atas ke bawah.

## Setelah Update

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Verifikasi

Test logo:
```bash
curl -I http://localhost/banks/bca.png
```

Harusnya return:
- `HTTP/1.1 200 OK`
- `Content-Type: image/png`

Bukan `{"detail":"Not Found"}`.

Test API (harus tetap bekerja):
```bash
curl http://localhost/banks/banks
```

Harusnya return JSON dengan list banks.

