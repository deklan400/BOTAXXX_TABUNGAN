#!/bin/bash

# Script Update Profile Management Feature
# Pastikan untuk menyesuaikan path dan nama service sesuai setup Anda

set -e  # Exit on error

echo "=========================================="
echo "Update Profile Management Feature"
echo "=========================================="

# ============================================
# KONFIGURASI - SESUAIKAN DENGAN SETUP ANDA
# ============================================

# Path aplikasi (SESUAIKAN)
APP_PATH="/var/www/botaxxx"
# atau
# APP_PATH="/home/user/botaxxx"

# Nama service backend (SESUAIKAN)
BACKEND_SERVICE="botaxxx-backend"
# atau
# BACKEND_SERVICE="gunicorn"

# User untuk permission (SESUAIKAN)
WEB_USER="www-data"
# atau
# WEB_USER="nginx"
# atau
# WEB_USER="$USER"

# Virtual environment path (SESUAIKAN)
VENV_PATH="venv"
# atau
# VENV_PATH=".venv"

# ============================================
# LANGKAH UPDATE
# ============================================

echo ""
echo "1. Masuk ke direktori aplikasi..."
cd "$APP_PATH" || { echo "Error: Gagal masuk ke $APP_PATH"; exit 1; }
pwd

echo ""
echo "2. Backup database (opsional)..."
read -p "Backup database? (y/n): " backup_db
if [ "$backup_db" = "y" ]; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    pg_dump -U botaxxx -d botaxxx_db > "$BACKUP_FILE" 2>/dev/null || echo "Warning: Gagal backup database (mungkin tidak menggunakan PostgreSQL langsung)"
    echo "Backup disimpan di: $BACKUP_FILE"
fi

echo ""
echo "3. Pull perubahan dari GitHub..."
git pull origin main || { echo "Error: Gagal pull dari GitHub"; exit 1; }

echo ""
echo "4. Membuat folder avatars..."
mkdir -p dashboard/public/avatars
chmod 755 dashboard/public/avatars
chown -R "$WEB_USER:$WEB_USER" dashboard/public/avatars || echo "Warning: Gagal set ownership (mungkin perlu sudo)"

echo ""
echo "5. Install dependencies backend..."
cd backend
if [ -d "$VENV_PATH" ]; then
    source "$VENV_PATH/bin/activate"
    pip install -r requirements.txt
    deactivate
else
    echo "Warning: Virtual environment tidak ditemukan, install tanpa venv"
    pip install -r requirements.txt
fi
cd ..

echo ""
echo "6. Install dependencies frontend..."
cd dashboard
npm install
npm run build
cd ..

echo ""
echo "7. Database migration (jika ada)..."
cd backend
if [ -d "$VENV_PATH" ]; then
    source "$VENV_PATH/bin/activate"
    alembic upgrade head || echo "Warning: Migration gagal atau tidak ada migration baru"
    deactivate
else
    alembic upgrade head || echo "Warning: Migration gagal atau tidak ada migration baru"
fi
cd ..

echo ""
echo "8. Restart backend service..."
if systemctl is-active --quiet "$BACKEND_SERVICE"; then
    sudo systemctl restart "$BACKEND_SERVICE" || echo "Warning: Gagal restart service (mungkin perlu sudo atau service tidak ada)"
else
    echo "Service $BACKEND_SERVICE tidak aktif, coba restart dengan PM2..."
    pm2 restart "$BACKEND_SERVICE" || pm2 restart all || echo "Warning: Gagal restart dengan PM2"
fi

echo ""
echo "9. Restart Nginx..."
sudo systemctl restart nginx || echo "Warning: Gagal restart nginx (mungkin tidak menggunakan nginx)"

echo ""
echo "10. Verifikasi folder avatars..."
if [ -w "dashboard/public/avatars" ]; then
    echo "✓ Folder avatars bisa ditulis"
else
    echo "✗ Folder avatars tidak bisa ditulis, set permission..."
    sudo chmod -R 755 dashboard/public/avatars
    sudo chown -R "$WEB_USER:$WEB_USER" dashboard/public/avatars
fi

echo ""
echo "=========================================="
echo "Update Selesai!"
echo "=========================================="
echo ""
echo "Langkah selanjutnya:"
echo "1. Cek log backend: tail -f /var/log/botaxxx/backend.log"
echo "2. Test aplikasi di browser"
echo "3. Coba upload avatar di Settings page"
echo ""
echo "Jika ada error, cek:"
echo "- Log backend: journalctl -u $BACKEND_SERVICE -f"
echo "- Log nginx: tail -f /var/log/nginx/error.log"
echo "- Permission folder: ls -la dashboard/public/avatars/"
echo ""

