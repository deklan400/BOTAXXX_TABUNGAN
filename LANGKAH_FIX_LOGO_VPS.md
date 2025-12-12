# Langkah-Langkah Fix Logo Bank di VPS

## Masalah
Logo bank tidak muncul di dashboard, hanya muncul huruf "B" (placeholder). Request ke `/banks/bca.png` return JSON `{"detail":"Not Found"}` karena di-proxy ke backend API.

## Solusi

### Langkah 1: SSH ke VPS
```bash
ssh root@YOUR_VPS_IP
```

### Langkah 2: Pull Update dari GitHub (Optional)
```bash
cd /var/www/botaxxx
git pull origin main
```

### Langkah 3: Edit Nginx Config
```bash
sudo nano /etc/nginx/sites-available/botaxxx
```

### Langkah 4: Cari dan Ubah Config

**Cari bagian ini:**
```nginx
location ~ ^/(docs|openapi.json|health|auth|users|overview|savings|loans|targets|banks) {
    proxy_pass http://127.0.0.1:8000;
    ...
}
```

**UBAH MENJADI** (tambahkan location untuk static files SEBELUM location API):

```nginx
    # Serve static bank logos (MUST be before API routes)
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

**PENTING:** 
- Location untuk static files (`/banks/.*\.(png|...)`) **HARUS** diletakkan **SEBELUM** location untuk API routes
- Ubah `|banks)` menjadi `|banks/banks|banks/accounts)` di regex API routes

### Langkah 5: Test Nginx Config
```bash
sudo nginx -t
```

Harusnya return: `syntax is ok` dan `test is successful`

### Langkah 6: Reload Nginx
```bash
sudo systemctl reload nginx
```

### Langkah 7: Pastikan Logo Ada di Dist Folder
```bash
# Cek logo di public folder
ls -la /var/www/botaxxx/dashboard/public/banks/

# Cek logo di dist folder
ls -la /var/www/botaxxx/dashboard/dist/banks/
```

Jika folder `dist/banks/` tidak ada atau kosong:
```bash
cd /var/www/botaxxx/dashboard
mkdir -p dist/banks
cp -r public/banks/* dist/banks/
chown -R www-data:www-data dist/banks
```

### Langkah 8: Verifikasi Logo Bisa Diakses
```bash
curl -I http://localhost/banks/bca.png
```

Harusnya return:
```
HTTP/1.1 200 OK
Content-Type: image/png
```

**BUKAN** `{"detail":"Not Found"}`

### Langkah 9: Test API Masih Bekerja
```bash
curl http://localhost/banks/banks
```

Harusnya return JSON dengan list banks.

### Langkah 10: Clear Browser Cache
Di browser:
- Tekan `Ctrl + Shift + R` (hard refresh)
- Atau buka di incognito mode
- Refresh halaman dashboard

## Alternatif: Pakai Script Otomatis

Jika sudah pull dari GitHub, bisa pakai script:

```bash
cd /var/www/botaxxx
sudo bash fix-nginx-banks.sh
```

Script akan:
1. Backup config lama
2. Update config otomatis
3. Test config
4. Reload Nginx
5. Verify logo access

## Troubleshooting

### Logo masih tidak muncul?
1. **Cek logo di dist folder:**
   ```bash
   ls -la /var/www/botaxxx/dashboard/dist/banks/
   ```
   Jika kosong, copy manual:
   ```bash
   cp -r /var/www/botaxxx/dashboard/public/banks/* /var/www/botaxxx/dashboard/dist/banks/
   ```

2. **Cek Nginx error log:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Cek permissions:**
   ```bash
   ls -la /var/www/botaxxx/dashboard/dist/banks/
   ```
   Harusnya owned by `www-data:www-data`

4. **Rebuild frontend:**
   ```bash
   cd /var/www/botaxxx/dashboard
   npm run build
   chown -R www-data:www-data dist
   ```

### API tidak bekerja?
Pastikan location block untuk API routes masih ada dan benar:
```bash
grep -A 5 "banks/banks\|banks/accounts" /etc/nginx/sites-available/botaxxx
```

## Selesai!

Setelah semua langkah, logo bank akan muncul di dashboard! 🎉

