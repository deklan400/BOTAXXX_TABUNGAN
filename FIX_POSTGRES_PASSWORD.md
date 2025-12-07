# 🔧 Fix: PostgreSQL Password Authentication Failed

## Problem

Error saat connect ke database:
```
psql: error: connection to server at "localhost" (127.0.0.1), port 5432 failed: 
FATAL: password authentication failed for user "botaxxx"
```

## Penyebab

1. Password di `.env` file tidak sesuai dengan password database
2. Password database tidak di-set dengan benar saat create user
3. Konfigurasi `pg_hba.conf` tidak mengizinkan password authentication

## Solusi

### Solusi 1: Reset Password Database User

```bash
# Login sebagai postgres superuser
sudo -u postgres psql

# Reset password untuk user botaxxx
ALTER USER botaxxx WITH PASSWORD 'new_password_here';

# Exit
\q
```

**PENTING:** Ganti `new_password_here` dengan password yang sama dengan yang ada di file `.env` backend!

### Solusi 2: Update Password di .env File

Jika password database sudah benar, update `.env` file:

```bash
cd /var/www/botaxxx/backend
nano .env
```

Pastikan `DATABASE_URL` menggunakan password yang benar:
```env
DATABASE_URL=postgresql://botaxxx:correct_password@localhost:5432/botaxxx_db
```

### Solusi 3: Check Password yang Tersimpan

Jika menggunakan deployment script, password tersimpan di:
```bash
# Check deployment info
cat /var/www/botaxxx/deployment_info.txt

# Atau check db_password.txt (jika ada)
cat /var/www/botaxxx/db_password.txt
```

### Solusi 4: Recreate User dengan Password Baru

Jika lupa password, recreate user:

```bash
sudo -u postgres psql << EOF
DROP USER IF EXISTS botaxxx;
CREATE USER botaxxx WITH PASSWORD 'your_secure_password_here';
ALTER ROLE botaxxx SET client_encoding TO 'utf8';
ALTER ROLE botaxxx SET default_transaction_isolation TO 'read committed';
ALTER ROLE botaxxx SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE botaxxx_db TO botaxxx;
\c botaxxx_db
GRANT ALL ON SCHEMA public TO botaxxx;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO botaxxx;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO botaxxx;
\q
EOF
```

**Jangan lupa update `.env` file dengan password baru!**

### Solusi 5: Check pg_hba.conf (Jika Masih Error)

Jika masih error setelah fix password, check konfigurasi authentication:

```bash
# Check pg_hba.conf
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -v "^#" | grep -v "^$"

# Pastikan ada baris untuk localhost:
# local   all             all                                     md5
# host    all             all             127.0.0.1/32            md5

# Jika perlu edit
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL setelah edit
sudo systemctl restart postgresql
```

## Setelah Fix

### 1. Update .env File

```bash
cd /var/www/botaxxx/backend
nano .env
```

Pastikan `DATABASE_URL` benar:
```env
DATABASE_URL=postgresql://botaxxx:your_password@localhost:5432/botaxxx_db
```

### 2. Test Koneksi

```bash
# Test dengan password prompt
psql -U botaxxx -d botaxxx_db -h localhost

# Atau test dengan PGPASSWORD environment variable
PGPASSWORD='your_password' psql -U botaxxx -d botaxxx_db -h localhost -c "SELECT 1;"
```

### 3. Jalankan Migration Lagi

```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
alembic upgrade head
```

## Verifikasi

```bash
# Test koneksi dari aplikasi
cd /var/www/botaxxx/backend
source venv/bin/activate
python3.11 << EOF
import os
from sqlalchemy import create_engine, text

# Load from .env
from dotenv import load_dotenv
load_dotenv()

db_url = os.getenv('DATABASE_URL')
engine = create_engine(db_url)

with engine.connect() as conn:
    result = conn.execute(text("SELECT 1"))
    print("Database connection successful!")
    print(f"Result: {result.fetchone()}")
EOF
```

## Catatan

- **Jangan hardcode password** di script atau file yang di-commit ke git
- **Simpan password dengan aman** di file `deployment_info.txt` dengan permission 600
- **Gunakan password yang kuat** (minimal 20 karakter, kombinasi huruf, angka, simbol)
- **Jangan share password** di public repository atau chat

---

**Note:** Migration sudah berjalan (Running upgrade -> 001_initial), jadi permission sudah OK. Masalahnya hanya di password authentication.

