# 🔧 Fix: PostgreSQL Permission Denied for Schema Public

## Problem

Error saat menjalankan `alembic upgrade head`:
```
psycopg2.errors.InsufficientPrivilege: permission denied for schema public
LINE 2: CREATE TABLE alembic_version (
```

## Penyebab

Di PostgreSQL 15+, user database tidak memiliki permission untuk create table di schema `public` secara default. Ini adalah perubahan security di PostgreSQL.

## Solusi

### Solusi 1: Grant CREATE Privilege (Recommended)

```bash
# Login sebagai postgres superuser
sudo -u postgres psql

# Grant CREATE privilege pada schema public untuk user botaxxx
GRANT CREATE ON SCHEMA public TO botaxxx;

# Atau grant semua privileges
GRANT ALL ON SCHEMA public TO botaxxx;

# Exit
\q
```

### Solusi 2: Alter Default Privileges

```bash
sudo -u postgres psql << EOF
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO botaxxx;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO botaxxx;
\q
EOF
```

### Solusi 3: Grant untuk Database (Comprehensive)

```bash
sudo -u postgres psql << EOF
-- Connect ke database
\c botaxxx_db

-- Grant privileges pada schema public
GRANT ALL ON SCHEMA public TO botaxxx;
GRANT CREATE ON SCHEMA public TO botaxxx;

-- Grant privileges untuk future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO botaxxx;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO botaxxx;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO botaxxx;

-- Verify
\dn+
\q
EOF
```

### Solusi 4: Recreate Database dengan Privileges

Jika database masih kosong, bisa recreate:

```bash
# Drop dan recreate database
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS botaxxx_db;
CREATE DATABASE botaxxx_db;
GRANT ALL PRIVILEGES ON DATABASE botaxxx_db TO botaxxx;
\c botaxxx_db
GRANT ALL ON SCHEMA public TO botaxxx;
\q
EOF
```

## Setelah Fix

Jalankan migration lagi:

```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
alembic upgrade head
```

## Verifikasi

```bash
# Test koneksi dan privileges
psql -U botaxxx -d botaxxx_db -h localhost << EOF
\dn+
SELECT has_schema_privilege('botaxxx', 'public', 'CREATE');
\q
EOF
```

Output harus menunjukkan `t` (true) untuk CREATE privilege.

## Update Script Deployment

Script `deploy-vps.sh` sudah diupdate untuk handle ini secara otomatis. Jika menggunakan script manual, pastikan grant privileges setelah create database.

---

**Note:** Error ini terjadi di PostgreSQL 15+ karena perubahan security policy. PostgreSQL 14 dan sebelumnya tidak memiliki masalah ini.

