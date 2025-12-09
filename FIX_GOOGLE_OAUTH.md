# Fix Google OAuth Login

## Problem
Error: `{"detail":"Google OAuth failed"}` saat klik "Login with Google"

## Penyebab
1. Google OAuth credentials belum dikonfigurasi di `.env`
2. Redirect URI tidak sesuai
3. Google Client ID/Secret salah

## Solusi

### Step 1: Cek Error Detail
```bash
# Check backend logs untuk error detail
sudo tail -50 /var/log/botaxxx/backend.error.log | grep -i google
```

### Step 2: Setup Google OAuth Credentials

#### A. Buat OAuth Credentials di Google Cloud Console

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Pilih project atau buat project baru
3. Enable APIs:
   - Go to "APIs & Services" > "Library"
   - Search "Google+ API" → Enable
   - Search "People API" → Enable (optional, untuk lebih banyak info)

4. Configure OAuth Consent Screen:
   - Go to "APIs & Services" > "OAuth consent screen"
   - User Type: **External** (atau Internal untuk G Suite)
   - App name: **BOTAXXX**
   - User support email: your email
   - Developer contact: your email
   - Save and Continue
   - Scopes: Add `email`, `profile`, `openid`
   - Save and Continue
   - Test users: Add your email (untuk testing)
   - Save and Continue

5. Create OAuth 2.0 Client ID:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: **Web application**
   - Name: **BOTAXXX Web Client**
   - Authorized JavaScript origins:
     ```
     http://YOUR_IP
     http://YOUR_IP:8000
     ```
   - Authorized redirect URIs:
     ```
     http://YOUR_IP:8000/auth/google/callback
     http://localhost:8000/auth/google/callback  (untuk testing)
     ```
   - Click "Create"
   - **Copy Client ID dan Client Secret**

#### B. Update Backend .env

```bash
cd /var/www/botaxxx/backend
nano .env
```

Tambahkan atau update:
```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here
GOOGLE_REDIRECT_URI=http://YOUR_IP:8000/auth/google/callback
FRONTEND_URL=http://YOUR_IP
```

**PENTING:**
- Ganti `YOUR_IP` dengan IP VPS Anda (contoh: `159.195.13.157`)
- Redirect URI harus **exact match** dengan yang di Google Console
- Tidak boleh ada trailing slash
- Harus include port jika bukan 80/443

### Step 3: Restart Backend

```bash
sudo systemctl restart botaxxx-backend

# Check status
sudo systemctl status botaxxx-backend

# Check logs
sudo tail -50 /var/log/botaxxx/backend.log
```

### Step 4: Test Google OAuth

1. Buka dashboard login page
2. Klik "Login with Google"
3. Seharusnya redirect ke Google login page
4. Setelah login, redirect kembali ke dashboard

## Troubleshooting

### Error: "GOOGLE_CLIENT_ID not configured"
**Fix:**
```bash
# Cek .env file
cat /var/www/botaxxx/backend/.env | grep GOOGLE

# Pastikan GOOGLE_CLIENT_ID ada dan tidak kosong
# Restart backend
sudo systemctl restart botaxxx-backend
```

### Error: "redirect_uri_mismatch"
**Fix:**
1. Cek redirect URI di Google Console
2. Pastikan exact match dengan `.env`:
   - Harus sama persis (case sensitive)
   - Harus include protocol (http://)
   - Harus include port jika ada
   - Tidak boleh ada trailing slash

**Contoh yang benar:**
```
http://159.195.13.157:8000/auth/google/callback
```

**Contoh yang salah:**
```
http://159.195.13.157:8000/auth/google/callback/  (trailing slash)
https://159.195.13.157:8000/auth/google/callback  (https instead of http)
http://159.195.13.157/auth/google/callback  (missing port)
```

### Error: "invalid_client"
**Fix:**
- Cek Client ID dan Secret benar
- Pastikan tidak ada extra spaces di `.env`
- Pastikan tidak ada quotes yang tidak perlu

### Error: "access_denied"
**Fix:**
- User membatalkan login
- OAuth consent screen belum dikonfigurasi
- User belum ditambahkan sebagai test user (untuk testing)

### Error: "OAuth consent screen not configured"
**Fix:**
1. Buka Google Cloud Console
2. Go to "APIs & Services" > "OAuth consent screen"
3. Complete setup:
   - App name
   - Support email
   - Scopes (email, profile, openid)
   - Test users (untuk testing)

## Verifikasi Setup

### Test 1: Check Configuration
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
python3.11 -c "
from app.core.config import settings
print(f'GOOGLE_CLIENT_ID: {settings.GOOGLE_CLIENT_ID[:20]}...' if settings.GOOGLE_CLIENT_ID else 'GOOGLE_CLIENT_ID: Not set')
print(f'GOOGLE_REDIRECT_URI: {settings.GOOGLE_REDIRECT_URI}')
print(f'FRONTEND_URL: {settings.FRONTEND_URL}')
"
```

### Test 2: Test OAuth URL Generation
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
python3.11 -c "
from app.settings.oauth_google import get_google_oauth_url
try:
    url = get_google_oauth_url()
    print(f'OAuth URL generated: {url[:80]}...')
except Exception as e:
    print(f'Error: {e}')
"
```

### Test 3: Test API Endpoint
```bash
# Test Google OAuth endpoint
curl -I http://localhost:8000/auth/google

# Should redirect to Google (302 status)
```

## Quick Fix Script

```bash
#!/bin/bash
# Quick fix untuk Google OAuth

echo "=== Checking Google OAuth Configuration ==="

cd /var/www/botaxxx/backend

# Check .env
if grep -q "GOOGLE_CLIENT_ID" .env; then
    echo "✓ GOOGLE_CLIENT_ID found"
    grep "GOOGLE_CLIENT_ID" .env | head -c 50
    echo "..."
else
    echo "✗ GOOGLE_CLIENT_ID not found in .env"
fi

if grep -q "GOOGLE_CLIENT_SECRET" .env; then
    echo "✓ GOOGLE_CLIENT_SECRET found"
else
    echo "✗ GOOGLE_CLIENT_SECRET not found in .env"
fi

if grep -q "GOOGLE_REDIRECT_URI" .env; then
    echo "✓ GOOGLE_REDIRECT_URI found"
    grep "GOOGLE_REDIRECT_URI" .env
else
    echo "✗ GOOGLE_REDIRECT_URI not found in .env"
fi

echo ""
echo "=== Restarting Backend ==="
sudo systemctl restart botaxxx-backend
sleep 2
sudo systemctl status botaxxx-backend --no-pager | head -10
```

## Example .env Configuration

```bash
# Backend .env
SECRET_KEY=your-secret-key-min-32-characters-long
DATABASE_URL=postgresql://botaxxx:botaxxx_password@localhost:5432/botaxxx_db
CORS_ORIGINS=http://159.195.13.157
FRONTEND_URL=http://159.195.13.157

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz123456
GOOGLE_REDIRECT_URI=http://159.195.13.157:8000/auth/google/callback
```

## Notes

- **Testing**: Untuk testing, tambahkan email Anda sebagai "Test user" di OAuth consent screen
- **Production**: Untuk production, perlu verifikasi OAuth consent screen
- **HTTPS**: Untuk production, gunakan HTTPS dan update redirect URI ke `https://`
- **Multiple Domains**: Bisa tambahkan multiple redirect URIs di Google Console

