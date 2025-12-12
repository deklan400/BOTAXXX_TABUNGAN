# Fix Logo Bank di VPS

## Masalah
Logo bank belum muncul di dashboard, hanya muncul huruf "B" (placeholder).

## Solusi

### Langkah 1: Pastikan Logo Ada di Public Folder
```bash
# Cek logo di VPS
ls -la /var/www/botaxxx/dashboard/public/banks/
```

Harusnya ada file seperti: `bca.png`, `mandiri.png`, dll.

### Langkah 2: Rebuild Frontend
```bash
cd /var/www/botaxxx/dashboard
npm run build
```

### Langkah 3: Cek Logo Ter-copy ke Dist
```bash
# Cek apakah logo sudah ter-copy ke dist/
ls -la /var/www/botaxxx/dashboard/dist/banks/
```

Jika folder `dist/banks/` tidak ada atau kosong, berarti build tidak copy logo.

### Langkah 4: Copy Manual (Jika Perlu)
```bash
# Copy manual dari public ke dist
mkdir -p /var/www/botaxxx/dashboard/dist/banks
cp -r /var/www/botaxxx/dashboard/public/banks/* /var/www/botaxxx/dashboard/dist/banks/
chown -R www-data:www-data /var/www/botaxxx/dashboard/dist/banks
```

### Langkah 5: Reload Nginx
```bash
systemctl reload nginx
```

### Langkah 6: Clear Browser Cache
- Tekan `Ctrl + Shift + R` (hard refresh)
- Atau buka di incognito mode

## Verifikasi

Test akses logo langsung:
```bash
curl http://localhost/banks/bca.png
```

Atau buka di browser:
```
http://YOUR_DOMAIN_OR_IP/banks/bca.png
```

Harusnya return gambar, bukan 404.

