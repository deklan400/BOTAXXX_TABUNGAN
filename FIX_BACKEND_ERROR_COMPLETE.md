# Fix Backend Error - Complete Guide

## Problem
Backend service fails to start with `status=1/FAILURE` after adding new models.

## Step-by-Step Fix

### Step 1: Check Error Logs
```bash
# Check detailed error
sudo journalctl -u botaxxx-backend -n 100 --no-pager

# Check error log file
sudo tail -100 /var/log/botaxxx/backend.error.log
```

### Step 2: Update Code
```bash
# Masuk ke directory backend
cd /var/www/botaxxx/backend

# Pull latest changes
git pull origin main

# Discard any local changes
git reset --hard HEAD
```

### Step 3: Test Imports
```bash
# Aktifkan virtual environment
source venv/bin/activate

# Test imports
python3.11 test_imports.py
```

Jika ada error, catat error message-nya.

### Step 4: Run Migration
```bash
# Pastikan masih di virtual environment
source venv/bin/activate

# Check current migration status
alembic current

# Run migration
alembic upgrade head
```

Jika migration error, lihat error message dan fix sesuai.

### Step 5: Verify Database Table
```bash
# Check if table exists
sudo -u postgres psql -d botaxxx_db -c "\d user_telegram_ids"
```

Jika table tidak ada, buat manual:
```bash
sudo -u postgres psql -d botaxxx_db << EOF
CREATE TABLE IF NOT EXISTS user_telegram_ids (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    telegram_id VARCHAR NOT NULL,
    telegram_username VARCHAR,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_user_telegram_ids_user_id ON user_telegram_ids(user_id);
CREATE INDEX IF NOT EXISTS ix_user_telegram_ids_telegram_id ON user_telegram_ids(telegram_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_user_telegram_ids_user_telegram ON user_telegram_ids(user_id, telegram_id);
EOF
```

### Step 6: Test Backend Startup
```bash
# Test manual startup
cd /var/www/botaxxx/backend
source venv/bin/activate

# Test import
python3.11 -c "from app.main import app; print('App loaded successfully')"
```

Jika error, catat error message.

### Step 7: Restart Service
```bash
# Restart backend
sudo systemctl restart botaxxx-backend

# Check status
sudo systemctl status botaxxx-backend

# Check logs
sudo tail -30 /var/log/botaxxx/backend.log
sudo tail -30 /var/log/botaxxx/backend.error.log
```

### Step 8: Test Health Endpoint
```bash
# Test API
curl http://localhost:8000/health
```

## Common Errors & Solutions

### Error: "No module named 'app.models.user_telegram'"
**Solution:**
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
# Verify file exists
ls -la app/models/user_telegram.py
# If missing, pull again
git pull origin main
```

### Error: "Table 'user_telegram_ids' does not exist"
**Solution:**
```bash
# Run migration
cd /var/www/botaxxx/backend
source venv/bin/activate
alembic upgrade head
```

### Error: "ImportError" or "ModuleNotFoundError"
**Solution:**
```bash
# Reinstall dependencies
cd /var/www/botaxxx/backend
source venv/bin/activate
pip install -r requirements.txt
```

### Error: "Database connection failed"
**Solution:**
```bash
# Check .env file
cat /var/www/botaxxx/backend/.env | grep DATABASE_URL

# Test database connection
sudo -u postgres psql -d botaxxx_db -c "SELECT 1;"
```

## Verification Checklist

- [ ] Code updated (git pull successful)
- [ ] Imports work (test_imports.py passes)
- [ ] Migration run (alembic upgrade head)
- [ ] Table exists (user_telegram_ids)
- [ ] Backend starts (systemctl status shows running)
- [ ] Health endpoint works (curl /health returns OK)
- [ ] No errors in logs

## If Still Failing

1. **Check exact error message:**
   ```bash
   sudo journalctl -u botaxxx-backend -n 50 --no-pager | grep -i error
   ```

2. **Test Python directly:**
   ```bash
   cd /var/www/botaxxx/backend
   source venv/bin/activate
   python3.11 -c "import sys; sys.path.insert(0, '.'); from app.main import app"
   ```

3. **Check file permissions:**
   ```bash
   ls -la /var/www/botaxxx/backend/app/models/
   ```

4. **Verify Python version:**
   ```bash
   python3.11 --version
   /var/www/botaxxx/backend/venv/bin/python --version
   ```

## Quick Fix Script

```bash
#!/bin/bash
cd /var/www/botaxxx/backend
source venv/bin/activate
git pull origin main
git reset --hard HEAD
pip install -r requirements.txt
alembic upgrade head
python3.11 test_imports.py
sudo systemctl restart botaxxx-backend
sleep 3
sudo systemctl status botaxxx-backend
curl http://localhost:8000/health
```

Save as `fix-backend.sh`, then:
```bash
chmod +x fix-backend.sh
sudo ./fix-backend.sh
```

