# Fix Backend Startup Error (status=1/FAILURE)

## Problem
Backend service fails to start with `status=1/FAILURE` after adding new models.

## Possible Causes
1. Model import error - new `UserTelegramID` model not imported properly
2. Migration not run - new table `user_telegram_ids` doesn't exist
3. Database connection issue
4. Missing dependencies

## Solution

### Step 1: Check Error Logs
```bash
# Check backend error log
sudo tail -50 /var/log/botaxxx/backend.error.log

# Check systemd journal
sudo journalctl -u botaxxx-backend -n 50 --no-pager
```

### Step 2: Run Migration
```bash
cd /var/www/botaxxx/backend
source venv/bin/activate

# Run migration to create user_telegram_ids table
alembic upgrade head
```

### Step 3: Verify Model Import
```bash
# Test Python import
cd /var/www/botaxxx/backend
source venv/bin/activate
python3.11 -c "from app.models import UserTelegramID; print('Import OK')"
```

### Step 4: Test Backend Startup
```bash
# Test manual startup
cd /var/www/botaxxx/backend
source venv/bin/activate
python3.11 -c "from app.main import app; print('App loaded successfully')"
```

### Step 5: Restart Service
```bash
sudo systemctl restart botaxxx-backend
sudo systemctl status botaxxx-backend
```

## Common Fixes

### If migration fails:
```bash
# Check current migration status
alembic current

# Check migration history
alembic history

# If needed, manually create table
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

### If import error:
```bash
# Reinstall dependencies
cd /var/www/botaxxx/backend
source venv/bin/activate
pip install -r requirements.txt
```

## Verification
After fix, verify:
```bash
# Check service status
sudo systemctl status botaxxx-backend

# Test health endpoint
curl http://localhost:8000/health

# Check logs
sudo tail -20 /var/log/botaxxx/backend.log
```

