# Fix bcrypt Version Compatibility Error

## Problem
The backend service is showing errors in the logs:
```
(trapped) error reading bcrypt version
AttributeError: module 'bcrypt' has no attribute '__about__'
```

This occurs because `passlib` 1.7.4 is incompatible with `bcrypt` version 4.0.0+, which removed the `__about__` attribute.

## Solution
Pin `bcrypt` to a version < 4.0.0 that is compatible with `passlib` 1.7.4.

## Steps to Fix on VPS

1. **SSH into your VPS:**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Navigate to the backend directory:**
   ```bash
   cd /var/www/botaxxx/backend
   ```

3. **Pull the latest changes (if you've committed the fix):**
   ```bash
   git pull origin main
   ```

4. **Activate the virtual environment:**
   ```bash
   source venv/bin/activate
   ```

5. **Uninstall the incompatible bcrypt version:**
   ```bash
   pip uninstall bcrypt -y
   ```

6. **Install the compatible bcrypt version:**
   ```bash
   pip install "bcrypt<4.0.0"
   ```
   
   Or reinstall all requirements:
   ```bash
   pip install -r requirements.txt
   ```

7. **Verify the bcrypt version:**
   ```bash
   pip show bcrypt
   ```
   
   You should see version 3.x.x (e.g., 3.2.2)

8. **Restart the backend service:**
   ```bash
   sudo systemctl restart botaxxx-backend
   ```

9. **Check the service status:**
   ```bash
   sudo systemctl status botaxxx-backend
   ```

10. **Monitor the logs to confirm the error is gone:**
    ```bash
    sudo tail -f /var/log/botaxxx/backend.error.log
    ```

## Alternative: Manual Fix (if git pull doesn't work)

If you can't pull the changes, manually edit the requirements.txt:

1. **Edit requirements.txt:**
   ```bash
   nano /var/www/botaxxx/backend/requirements.txt
   ```

2. **Add this line after `passlib[bcrypt]==1.7.4`:**
   ```
   bcrypt<4.0.0
   ```

3. **Save and exit (Ctrl+X, then Y, then Enter)**

4. **Reinstall requirements:**
   ```bash
   source venv/bin/activate
   pip install -r requirements.txt
   ```

5. **Restart the service:**
   ```bash
   sudo systemctl restart botaxxx-backend
   ```

## Verification

After applying the fix, the error should no longer appear in the logs. The backend service should start and run without the bcrypt version error.

## Notes

- The `bcrypt<4.0.0` constraint ensures compatibility with `passlib` 1.7.4
- This is a known compatibility issue between passlib and newer bcrypt versions
- The error is "trapped" by passlib, so it doesn't crash the service, but it's still good to fix it

