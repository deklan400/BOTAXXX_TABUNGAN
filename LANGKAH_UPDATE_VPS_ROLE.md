# 🚀 Langkah Update Role Management ke VPS

## COPY PASTE LANGSUNG - Semua Langkah Sekaligus

```bash
# ============================================
# LANGKAH 1: Masuk ke VPS
# ============================================
ssh root@159.195.13.157

# ============================================
# LANGKAH 2: Masuk ke direktori aplikasi
# ============================================
cd /var/www/botaxxx

# ============================================
# LANGKAH 3: Pull perubahan dari GitHub
# ============================================
git pull origin main

# ============================================
# LANGKAH 4: Install dependencies backend
# ============================================
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# ============================================
# LANGKAH 5: Install dependencies frontend
# ============================================
cd dashboard
npm install
npm run build
cd ..

# ============================================
# LANGKAH 6: Restart services
# ============================================
sudo systemctl restart botaxxx-backend
sudo systemctl restart nginx

# ============================================
# LANGKAH 7: Verifikasi
# ============================================
echo "✅ Update selesai! Test aplikasi di browser: http://159.195.13.157"
```

---

## 📋 LANGKAH DETAIL (Step by Step)

### Step 1: Masuk ke VPS
```bash
ssh root@159.195.13.157
```

### Step 2: Masuk ke Direktori Aplikasi
```bash
cd /var/www/botaxxx
pwd  # Pastikan di direktori yang benar
```

### Step 3: Pull Perubahan dari GitHub
```bash
git pull origin main
```

**Jika ada konflik:**
```bash
git stash
git pull origin main
git stash pop
```

### Step 4: Install Dependencies Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..
```

### Step 5: Install Dependencies Frontend
```bash
cd dashboard
npm install
npm run build
cd ..
```

**Jika build error:**
```bash
cd dashboard
rm -rf node_modules
rm -rf dist
npm install
npm run build
cd ..
```

### Step 6: Database Migration (Jika Ada)
```bash
cd backend
source venv/bin/activate
alembic upgrade head
deactivate
cd ..
```

### Step 7: Restart Backend Service
```bash
sudo systemctl restart botaxxx-backend
sudo systemctl status botaxxx-backend
```

### Step 8: Restart Nginx
```bash
sudo nginx -t  # Test config dulu
sudo systemctl restart nginx
sudo systemctl status nginx
```

### Step 9: Verifikasi
```bash
# Cek log backend
tail -f /var/log/botaxxx/backend.log

# Atau
journalctl -u botaxxx-backend -f
```

### Step 10: Test di Browser
1. Buka: `http://159.195.13.157`
2. Login sebagai admin
3. Buka menu "Role Management"
4. Test fitur naikkan/turunkan role

---

## 🔧 TROUBLESHOOTING

### Jika Git Pull Error
```bash
# Stash perubahan lokal
git stash

# Pull lagi
git pull origin main

# Apply stash jika perlu
git stash pop
```

### Jika Build Frontend Error
```bash
cd dashboard
rm -rf node_modules dist
npm cache clean --force
npm install
npm run build
cd ..
```

### Jika Backend Tidak Start
```bash
# Cek error
sudo journalctl -u botaxxx-backend -n 50

# Restart
sudo systemctl restart botaxxx-backend

# Cek status
sudo systemctl status botaxxx-backend
```

### Jika Nginx Error
```bash
# Test config
sudo nginx -t

# Cek error log
sudo tail -f /var/log/nginx/error.log

# Reload
sudo nginx -s reload
```

### Jika Fitur Tidak Muncul
```bash
# Pastikan build berhasil
ls -la dashboard/dist/

# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) atau Cmd+Shift+R (Mac)
```

---

## ✅ CHECKLIST

Setelah update, pastikan:
- [ ] Git pull berhasil
- [ ] Dependencies terinstall
- [ ] Build frontend berhasil
- [ ] Backend service running
- [ ] Nginx running
- [ ] Menu "Role Management" muncul
- [ ] Fitur naikkan/turunkan role bekerja
- [ ] Tidak ada error di console browser
- [ ] Tidak ada error di log backend

---

## 🎯 QUICK REFERENCE

```bash
# Semua langkah dalam satu command (copy semua)
ssh root@159.195.13.157 "cd /var/www/botaxxx && git pull origin main && cd backend && source venv/bin/activate && pip install -r requirements.txt && deactivate && cd ../dashboard && npm install && npm run build && cd .. && sudo systemctl restart botaxxx-backend && sudo systemctl restart nginx && echo 'Update selesai!'"
```

**ATAU** jalankan step by step seperti di atas untuk lebih aman.

