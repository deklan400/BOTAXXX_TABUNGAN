# 🔧 Fix: Bot 404 Error - /auth/telegram-login Not Found

## Problem

Bot error saat `/start`:
```
Error: Client error '404 Not Found' for url 'http://localhost:8000/auth/telegram-login'
```

## Diagnosis

### 1. Check Backend API Endpoints

```bash
# Test endpoint langsung
curl -X POST http://localhost:8000/auth/telegram-login \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": "123456"}'

# Check API docs
curl http://localhost:8000/docs
```

### 2. Check Backend Logs

```bash
# Check backend logs untuk melihat request
sudo journalctl -u botaxxx-backend -n 50 --no-pager

# Check apakah endpoint terdaftar
curl http://localhost:8000/openapi.json | grep telegram-login
```

### 3. Verify Backend is Running

```bash
# Check backend status
sudo systemctl status botaxxx-backend

# Test health endpoint
curl http://localhost:8000/health

# Check apakah port 8000 listening
sudo netstat -tlnp | grep :8000
# atau
sudo ss -tlnp | grep :8000
```

## Solutions

### Solution 1: Restart Backend

```bash
# Restart backend
sudo systemctl restart botaxxx-backend

# Wait a few seconds
sleep 5

# Test endpoint
curl -X POST http://localhost:8000/auth/telegram-login \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": "123456"}'
```

### Solution 2: Check API Route Registration

```bash
# Check OpenAPI schema
curl http://localhost:8000/openapi.json | python3 -m json.tool | grep telegram

# Should show:
# "/auth/telegram-login"
```

### Solution 3: Test Backend Manual

```bash
cd /var/www/botaxxx/backend
source venv/bin/activate

# Start backend manual
uvicorn app.main:app --host 127.0.0.1 --port 8000

# In another terminal, test:
curl -X POST http://localhost:8000/auth/telegram-login \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": "123456"}'
```

### Solution 4: Check User Registration

Bot memerlukan user sudah register di dashboard dulu. Pastikan:

1. User sudah register di dashboard web
2. User sudah set Telegram ID di profile settings
3. Telegram ID di profile sama dengan Telegram user ID yang menggunakan bot

**Cara check Telegram ID:**
- Kirim `/start` ke bot @userinfobot di Telegram
- Atau gunakan Telegram Web/Desktop, lihat URL saat chat dengan bot

## Quick Fix Commands

```bash
# 1. Restart backend
sudo systemctl restart botaxxx-backend
sleep 3

# 2. Test endpoint
curl -X POST http://localhost:8000/auth/telegram-login \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": "123456"}'

# 3. Check backend logs
sudo journalctl -u botaxxx-backend -n 20 --no-pager

# 4. Restart bot
sudo systemctl restart botaxxx-bot
```

## Expected Response

Jika endpoint bekerja, response seharusnya:
```json
{
  "access_token": "...",
  "token_type": "bearer"
}
```

Atau error jika user belum register:
```json
{
  "detail": "User not found. Please register in dashboard first."
}
```

## Verification

```bash
# Check semua services running
sudo systemctl status botaxxx-backend botaxxx-bot

# Test API
curl http://localhost:8000/health
curl http://localhost:8000/docs

# Test telegram-login endpoint
curl -X POST http://localhost:8000/auth/telegram-login \
  -H "Content-Type: application/json" \
  -d '{"telegram_id": "your-telegram-id"}'
```

---

**Note:** Pastikan user sudah register di dashboard dan set Telegram ID sebelum menggunakan bot!

