# 🔧 Fix: Services Not Running (Backend & Bot)

## Problem

Services terus restart dengan `status=1/FAILURE`:
- `botaxxx-backend.service: Main process exited, code=exited, status=1/FAILURE`
- `botaxxx-bot.service: Main process exited, code=exited, status=1/FAILURE`

## Diagnosis

### 1. Check Error Logs

```bash
# Check backend error log
sudo tail -f /var/log/botaxxx/backend.error.log

# Check bot error log
sudo tail -f /var/log/botaxxx/bot.error.log

# Check backend output log
sudo tail -f /var/log/botaxxx/backend.log

# Check bot output log
sudo tail -f /var/log/botaxxx/bot.log
```

### 2. Test Manual Backend

```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

**Common errors:**
- Database connection error
- Missing .env file
- Port 8000 already in use
- Permission denied

### 3. Test Manual Bot

```bash
cd /var/www/botaxxx/bot
source venv/bin/activate
python main.py
```

**Common errors:**
- Telegram token not set
- API connection error
- Missing .env file

## Solutions

### Fix Backend

#### Error: Database Connection

```bash
# Check database password in .env
cat /var/www/botaxxx/backend/.env | grep DATABASE_URL

# Test database connection
cd /var/www/botaxxx/backend
source venv/bin/activate
python3.11 << EOF
import os
from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, text

db_url = os.getenv('DATABASE_URL')
engine = create_engine(db_url)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("Database connection OK!")
except Exception as e:
    print(f"Database error: {e}")
EOF
```

#### Error: Port Already in Use

```bash
# Check what's using port 8000
sudo lsof -i :8000
# or
sudo netstat -tlnp | grep :8000

# Kill process if needed
sudo kill -9 <PID>
```

#### Error: Permission Denied

```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/botaxxx
sudo chmod -R 755 /var/www/botaxxx
```

### Fix Bot

#### Error: Telegram Token Not Set

```bash
# Edit bot .env
nano /var/www/botaxxx/bot/.env

# Add token
TELEGRAM_BOT_TOKEN=your-token-here
API_BASE_URL=http://localhost:8000
```

#### Error: API Connection Failed

```bash
# Check if backend is running
curl http://localhost:8000/health

# If not running, start backend first
sudo systemctl start botaxxx-backend
```

## Quick Fix Commands

```bash
# 1. Check error logs
sudo tail -50 /var/log/botaxxx/backend.error.log
sudo tail -50 /var/log/botaxxx/bot.error.log

# 2. Test backend manual
cd /var/www/botaxxx/backend
source venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8000

# 3. Test bot manual
cd /var/www/botaxxx/bot
source venv/bin/activate
python main.py

# 4. Fix permissions
sudo chown -R www-data:www-data /var/www/botaxxx
sudo chmod -R 755 /var/www/botaxxx

# 5. Restart services
sudo systemctl restart botaxxx-backend
sudo systemctl restart botaxxx-bot

# 6. Check status
sudo systemctl status botaxxx-backend
sudo systemctl status botaxxx-bot
```

## Verify Fix

```bash
# Check services are running
sudo systemctl status botaxxx-backend
sudo systemctl status botaxxx-bot

# Test API
curl http://localhost:8000/health

# Check logs (should be clean)
sudo journalctl -u botaxxx-backend -n 20
sudo journalctl -u botaxxx-bot -n 20
```

