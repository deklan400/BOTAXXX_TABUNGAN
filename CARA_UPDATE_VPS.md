# 🚀 Cara Update Aplikasi di VPS

## ⚡ Cara Cepat (Recommended)

### 1. Login ke VPS
```bash
ssh root@VPS_IP
```

### 2. Jalankan Script Update
```bash
cd /var/www/botaxxx
sudo bash quick-update-vps.sh
```

**Selesai!** Script akan otomatis:
- Pull perubahan dari GitHub
- Update dependencies
- Run migrations
- Rebuild frontend
- Restart services

---

## 📝 Cara Manual (Jika Script Gagal)

### 1. Login ke VPS
```bash
ssh root@VPS_IP
```

### 2. Pull Perubahan
```bash
cd /var/www/botaxxx
git pull origin main
```

### 3. Update Backend
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
```

### 4. Rebuild Frontend
```bash
cd /var/www/botaxxx/dashboard
npm install
npm run build
```

### 5. Restart Services
```bash
systemctl restart botaxxx-backend
systemctl restart botaxxx-bot
systemctl reload nginx
```

### 6. Check Status
```bash
systemctl status botaxxx-backend botaxxx-bot
```

---

## 🔍 Troubleshooting

### Backend tidak jalan?
```bash
journalctl -u botaxxx-backend -n 50
```

### Frontend tidak update?
- Clear browser cache (Ctrl+Shift+R)
- Check build: `ls -la /var/www/botaxxx/dashboard/dist`

### Git pull error?
```bash
cd /var/www/botaxxx
git status
git fetch origin
git reset --hard origin/main
```

---

## 📚 Dokumentasi Lengkap

Lihat `PUSH_UPDATE_VPS.md` untuk panduan lengkap dan troubleshooting detail.

