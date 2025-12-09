# Update Logo Aplikasi

## Cara Update Logo

### Step 1: Siapkan Logo
1. Siapkan file logo (format PNG, JPG, atau SVG)
2. Ukuran recommended: 512x512px atau lebih besar
3. Background transparent (untuk hasil terbaik)

### Step 2: Upload Logo ke VPS
```bash
# Upload logo ke dashboard/public/
# Bisa via SCP, SFTP, atau langsung edit di VPS

# Via SCP (dari local):
scp logo.png user@YOUR_IP:/var/www/botaxxx/dashboard/public/logo.png

# Atau langsung di VPS:
cd /var/www/botaxxx/dashboard/public
# Upload file logo.png ke sini
```

### Step 3: Replace File
```bash
cd /var/www/botaxxx/dashboard/public
# Backup logo lama (jika ada)
mv logo.png logo.png.backup

# Upload logo baru dengan nama logo.png
# Atau rename file yang sudah diupload
mv your_logo_file.png logo.png
```

### Step 4: Rebuild Dashboard
```bash
cd /var/www/botaxxx/dashboard
npm run build
sudo systemctl reload nginx
```

### Step 5: Clear Browser Cache
- Hard refresh browser: `Ctrl+Shift+R` (Windows) atau `Cmd+Shift+R` (Mac)
- Atau clear cache browser

## Lokasi Logo

Logo digunakan di:
- ✅ Sidebar header
- ✅ Login page
- ✅ Register page
- ✅ Favicon (browser tab)

## File Locations

- **Logo Image**: `/var/www/botaxxx/dashboard/public/logo.png`
- **Favicon**: `/var/www/botaxxx/dashboard/public/favicon.ico`

## Tips

1. **Format**: PNG dengan background transparent (recommended)
2. **Ukuran**: 512x512px atau lebih besar (akan di-resize otomatis)
3. **Nama File**: Harus `logo.png` di folder `public/`
4. **Cache**: Setelah update, clear browser cache untuk melihat perubahan

## Fallback

Jika logo tidak ditemukan, akan menampilkan huruf "B" sebagai fallback.

