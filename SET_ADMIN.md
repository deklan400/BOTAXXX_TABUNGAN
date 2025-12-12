# Cara Set User Menjadi Admin

## Cara 1: Via SQL (Paling Mudah)

Setelah migration, jalankan di database:

```bash
# SSH ke VPS
ssh root@YOUR_VPS_IP

# Masuk ke PostgreSQL
sudo -u postgres psql botaxxx_db
```

Lalu jalankan SQL:
```sql
-- Set user dengan email tertentu jadi admin
UPDATE users SET role='admin' WHERE email='your-email@example.com';

-- Verifikasi
SELECT id, name, email, role, is_active FROM users WHERE role='admin';

-- Keluar
\q
```

## Cara 2: Via Python Script

Buat script untuk set admin:

```bash
cd /var/www/botaxxx/backend
source venv/bin/activate
python -c "
from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email=='your-email@example.com').first()
if user:
    user.role = 'admin'
    db.commit()
    print(f'User {user.email} is now admin!')
else:
    print('User not found!')
db.close()
"
```

## Cara 3: Set Admin Saat Register (Development Only)

Untuk development, bisa modifikasi register endpoint untuk auto-set admin jika email tertentu.

## Setelah Set Admin

1. Login dengan email/password biasa
2. User tersebut akan punya akses ke semua endpoint `/admin/*`
3. Frontend bisa check `user.role === 'admin'` untuk show admin menu

## Verifikasi

Test endpoint admin:
```bash
# Login dulu untuk dapat token
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'

# Test admin endpoint dengan token
curl -X GET http://localhost:8000/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Harusnya return stats, bukan 403 Forbidden.

