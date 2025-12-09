# Upload Logo via Terminal VPS

## Cara 1: Upload dari Local ke VPS (SCP)

### Dari Windows (PowerShell atau CMD)
```powershell
# Pastikan logo.png ada di current directory
scp logo.png user@YOUR_IP:/var/www/botaxxx/dashboard/public/logo.png

# Contoh:
scp logo.png root@159.195.13.157:/var/www/botaxxx/dashboard/public/logo.png
```

### Dari Mac/Linux
```bash
# Pastikan logo.png ada di current directory
scp logo.png user@YOUR_IP:/var/www/botaxxx/dashboard/public/logo.png

# Contoh:
scp logo.png root@159.195.13.157:/var/www/botaxxx/dashboard/public/logo.png
```

---

## Cara 2: Download dari URL (jika logo ada di internet)

### Di VPS Terminal
```bash
cd /var/www/botaxxx/dashboard/public

# Download dari URL
sudo wget -O logo.png "URL_LOGO_DISINI"

# Atau dengan curl
sudo curl -o logo.png "URL_LOGO_DISINI"

# Set permissions
sudo chown www-data:www-data logo.png
sudo chmod 644 logo.png
```

---

## Cara 3: Upload via Base64 (jika punya file di local)

### Step 1: Convert ke Base64 (di local)
```bash
# Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("logo.png")) | Out-File -Encoding ASCII logo_base64.txt

# Mac/Linux:
base64 logo.png > logo_base64.txt
```

### Step 2: Copy Base64 ke VPS
```bash
# Di VPS, buat file:
nano /tmp/logo_base64.txt
# Paste base64 content, lalu Ctrl+X, Y, Enter
```

### Step 3: Decode di VPS
```bash
# Decode base64 ke file
cd /var/www/botaxxx/dashboard/public
sudo base64 -d /tmp/logo_base64.txt > logo.png

# Set permissions
sudo chown www-data:www-data logo.png
sudo chmod 644 logo.png

# Cleanup
sudo rm /tmp/logo_base64.txt
```

---

## Cara 4: Upload via SFTP (interactive)

### Connect ke VPS
```bash
# Di terminal local
sftp user@YOUR_IP

# Setelah connect:
cd /var/www/botaxxx/dashboard/public
put logo.png
exit
```

---

## Cara 5: Copy dari Local ke VPS (jika sudah SSH)

### Jika sudah SSH ke VPS
```bash
# Di terminal local, buka 2 terminal:
# Terminal 1: SSH ke VPS
ssh user@YOUR_IP

# Terminal 2: SCP upload
scp logo.png user@YOUR_IP:/var/www/botaxxx/dashboard/public/logo.png
```

---

## Cara 6: Upload via HTTP Server (temporary)

### Step 1: Start HTTP Server di Local
```bash
# Di directory yang ada logo.png
# Python 3:
python3 -m http.server 8000

# Atau Python 2:
python -m SimpleHTTPServer 8000
```

### Step 2: Download dari VPS
```bash
# Di VPS terminal
cd /var/www/botaxxx/dashboard/public
sudo wget http://YOUR_LOCAL_IP:8000/logo.png

# Set permissions
sudo chown www-data:www-data logo.png
sudo chmod 644 logo.png
```

---

## Setelah Upload

### Step 1: Set Permissions
```bash
cd /var/www/botaxxx/dashboard/public
sudo chown www-data:www-data logo.png
sudo chmod 644 logo.png
```

### Step 2: Rebuild Dashboard
```bash
cd /var/www/botaxxx/dashboard
npm run build
```

### Step 3: Reload Nginx
```bash
sudo systemctl reload nginx
```

### Step 4: Verify
```bash
# Check file exists
ls -la /var/www/botaxxx/dashboard/public/logo.png

# Check file size
du -h /var/www/botaxxx/dashboard/public/logo.png
```

---

## Quick Command (All-in-One)

```bash
# Setelah upload logo, jalankan semua ini:
cd /var/www/botaxxx/dashboard/public
sudo chown www-data:www-data logo.png
sudo chmod 644 logo.png
cd /var/www/botaxxx/dashboard
npm run build
sudo systemctl reload nginx
echo "Logo updated! Clear browser cache (Ctrl+Shift+R)"
```

---

## Troubleshooting

### Error: Permission denied
```bash
sudo chown www-data:www-data /var/www/botaxxx/dashboard/public/logo.png
sudo chmod 644 /var/www/botaxxx/dashboard/public/logo.png
```

### Error: File not found after upload
```bash
# Check file location
ls -la /var/www/botaxxx/dashboard/public/

# Check if file exists
file /var/www/botaxxx/dashboard/public/logo.png
```

### Logo tidak muncul di browser
1. Clear browser cache: `Ctrl+Shift+R`
2. Check file permissions
3. Rebuild dashboard: `npm run build`
4. Check browser console untuk error

---

## Recommended: SCP Method

**Paling mudah dan cepat:**

```bash
# Dari local terminal (Windows/Mac/Linux)
scp logo.png user@YOUR_IP:/var/www/botaxxx/dashboard/public/logo.png

# Setelah upload, SSH ke VPS dan jalankan:
ssh user@YOUR_IP
cd /var/www/botaxxx/dashboard/public
sudo chown www-data:www-data logo.png
sudo chmod 644 logo.png
cd /var/www/botaxxx/dashboard
npm run build
sudo systemctl reload nginx
```

