# Setup Google OAuth Login

## Prerequisites
1. Google Cloud Console account
2. Access to backend `.env` file

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure OAuth consent screen:
     - User Type: External (or Internal for G Suite)
     - App name: BOTAXXX
     - User support email: your email
     - Developer contact: your email
     - Save and continue
   - Application type: **Web application**
   - Name: BOTAXXX Web Client
   - Authorized redirect URIs:
     ```
     http://YOUR_DOMAIN_OR_IP:8000/auth/google/callback
     http://localhost:8000/auth/google/callback  (for testing)
     ```
   - Click "Create"
   - Copy **Client ID** and **Client Secret**

## Step 2: Configure Backend

Edit `/var/www/botaxxx/backend/.env`:

```bash
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://YOUR_DOMAIN_OR_IP:8000/auth/google/callback
```

**Important:** Replace `YOUR_DOMAIN_OR_IP` with your actual domain or IP address.

## Step 3: Configure Frontend

The frontend automatically uses the API base URL from environment. Make sure:

1. `VITE_API_BASE_URL` in dashboard `.env` points to your backend
2. Or it will default to `http://localhost:8000`

## Step 4: Restart Services

```bash
# Restart backend
sudo systemctl restart botaxxx-backend

# Check status
sudo systemctl status botaxxx-backend

# Check logs for any errors
sudo tail -50 /var/log/botaxxx/backend.log
```

## Step 5: Test Google Login

1. Open dashboard login page
2. Click "Login with Google"
3. Should redirect to Google login
4. After login, should redirect back to dashboard

## Troubleshooting

### Error: "GOOGLE_CLIENT_ID not configured"
- Check `.env` file has `GOOGLE_CLIENT_ID` set
- Restart backend service

### Error: "redirect_uri_mismatch"
- Check redirect URI in Google Console matches exactly
- Must include protocol (http:// or https://)
- Must include port if not 80/443
- No trailing slash

### Error: "invalid_client"
- Check Client ID and Secret are correct
- Make sure no extra spaces in `.env` file

### Error: "access_denied"
- User cancelled Google login
- Check OAuth consent screen is configured

## Security Notes

1. **Never commit** `.env` file with credentials
2. Use HTTPS in production
3. Keep Client Secret secure
4. Regularly rotate credentials

## Example .env Configuration

```bash
# Backend .env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=http://159.195.13.157:8000/auth/google/callback
FRONTEND_URL=http://159.195.13.157
```

## Verification

After setup, test:
```bash
# Check backend can generate OAuth URL
curl http://localhost:8000/auth/google

# Should redirect to Google login page
```

