# Fix Authentication Error

## Problem
When accessing API endpoints directly (e.g., `http://159.195.13.157/loans/`), you get:
```json
{"detail":"Not authenticated"}
```

## Explanation
This is **expected behavior**. The API endpoints require authentication via JWT token. You cannot access them directly via browser.

## Solution

### Option 1: Access via Dashboard (Recommended)
1. Open the dashboard: `http://159.195.13.157` (or your domain)
2. Login with your credentials
3. Navigate to Loans/Savings/Targets pages
4. The dashboard will automatically send the authentication token with each request

### Option 2: Test API with Token
If you need to test the API directly, you need to include the token:

```bash
# First, login to get token
curl -X POST http://159.195.13.157/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'

# Response will include access_token
# Then use it to access protected endpoints:
curl -X GET http://159.195.13.157/loans \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Option 3: Check Token in Browser
1. Open dashboard and login
2. Open browser DevTools (F12)
3. Go to Application/Storage > Local Storage
4. Check if `token` exists
5. If token exists, the dashboard should work

## Common Issues

### Issue 1: Token Not Stored
**Symptom:** Dashboard redirects to login immediately
**Fix:** 
- Check browser console for errors
- Verify login API is working: `curl http://159.195.13.157/auth/login`
- Check CORS settings in backend

### Issue 2: Token Expired
**Symptom:** Works initially, then stops working
**Fix:**
- Token expires after 7 days (default)
- Just login again
- Or increase `ACCESS_TOKEN_EXPIRE_MINUTES` in backend `.env`

### Issue 3: CORS Error
**Symptom:** Browser console shows CORS error
**Fix:**
- Check `CORS_ORIGINS` in backend `.env`
- Should include your frontend URL: `http://159.195.13.157`

### Issue 4: Wrong API URL
**Symptom:** All API calls fail
**Fix:**
- Check `VITE_API_BASE_URL` in dashboard `.env` or build config
- Should be: `http://159.195.13.157` (or your backend URL)

## Verification Steps

1. **Check Backend is Running:**
   ```bash
   curl http://159.195.13.157/health
   ```

2. **Check Login Works:**
   ```bash
   curl -X POST http://159.195.13.157/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test12345"}'
   ```

3. **Check Dashboard:**
   - Open `http://159.195.13.157` in browser
   - Should see login page
   - Login with credentials
   - Should redirect to dashboard

4. **Check Token in Browser:**
   - Open DevTools (F12)
   - Application > Local Storage
   - Should see `token` key with JWT value

## Quick Test Script

```bash
#!/bin/bash
API_URL="http://159.195.13.157"

echo "1. Testing health endpoint..."
curl -s $API_URL/health | jq .

echo -e "\n2. Testing login..."
TOKEN=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test12345"}' | jq -r '.access_token')

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo "✓ Login successful, token received"
  
  echo -e "\n3. Testing protected endpoint with token..."
  curl -s -H "Authorization: Bearer $TOKEN" $API_URL/loans | jq .
else
  echo "✗ Login failed"
fi
```

## Notes

- **Direct API Access:** Not supported without token (by design for security)
- **Dashboard Access:** Always use the dashboard UI for normal usage
- **API Testing:** Use curl/Postman with Bearer token for testing
- **Token Storage:** Tokens are stored in browser localStorage (secure for same-origin)

