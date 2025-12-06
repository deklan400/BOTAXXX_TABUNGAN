# 🔧 Troubleshooting Guide

## Problem: Directory tidak ditemukan

### Error:
```
cd: /var/www/botaxxx/backend: No such file or directory
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

### Solusi:

**Step 1: Clone Repository Dulu**

```bash
# Create directory
sudo mkdir -p /var/www/botaxxx
sudo chown $USER:$USER /var/www/botaxxx
cd /var/www/botaxxx

# Clone repository
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git .

# Verify
ls -la
# Should see: backend, dashboard, bot directories
```

**Step 2: Baru Setup Backend**

```bash
# Sekarang baru masuk ke backend
cd /var/www/botaxxx/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Verify requirements.txt exists
ls -la requirements.txt

# Install dependencies
pip install -r requirements.txt
```

---

## Problem: Pip upgrade error

### Error:
```
error: uninstall-no-record-file
Cannot uninstall pip 24.0
The package was installed by debian.
```

### Solusi:

**Option 1: Skip Upgrade (Recommended)**
```bash
# Di virtual environment, langsung install tanpa upgrade
pip install -r requirements.txt
```

**Option 2: Use --break-system-packages**
```bash
python3.11 -m pip install --upgrade pip --break-system-packages
pip install -r requirements.txt
```

---

## Problem: Virtual environment di wrong directory

### Error:
Membuat venv di `~` (home) padahal harus di project directory.

### Solusi:

```bash
# Pastikan di directory yang benar
cd /var/www/botaxxx/backend

# Hapus venv yang salah (jika ada di home)
rm -rf ~/venv

# Buat venv di directory yang benar
python3.11 -m venv venv
source venv/bin/activate
```

---

## Complete Setup Flow (Correct Order)

```bash
# 1. Create directory
sudo mkdir -p /var/www/botaxxx
sudo chown $USER:$USER /var/www/botaxxx
cd /var/www/botaxxx

# 2. Clone repository
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git .

# 3. Verify structure
ls -la
# Should see: backend/, dashboard/, bot/, docker-compose.yml, etc.

# 4. Setup Backend
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt  # Skip upgrade jika error

# 5. Setup Frontend
cd ../dashboard
npm install
npm run build

# 6. Setup Bot
cd ../bot
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Quick Fix Commands

Jika sudah membuat venv di wrong directory:

```bash
# Hapus venv yang salah
rm -rf ~/venv

# Clone repository (jika belum)
cd /var/www
sudo mkdir -p botaxxx
sudo chown $USER:$USER botaxxx
cd botaxxx
git clone https://github.com/deklan400/BOTAXXX_TABUNGAN.git .

# Setup dengan benar
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Checklist

Sebelum setup backend, pastikan:
- [ ] Directory `/var/www/botaxxx` sudah dibuat
- [ ] Repository sudah di-clone
- [ ] File `requirements.txt` ada di `backend/` directory
- [ ] Python 3.11 sudah terinstall
- [ ] Virtual environment dibuat di `backend/` directory, bukan di home

