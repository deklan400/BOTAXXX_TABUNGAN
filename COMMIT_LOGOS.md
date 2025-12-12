# Cara Commit Logo Bank

## Langkah 1: Download Logo dari VPS ke Local

### Opsi A: Via File Manager (FileZilla/WinSCP)
1. Buka file manager (FileZilla/WinSCP)
2. Navigate ke: `/var/www/botaxxx/dashboard/public/banks/`
3. Select semua file `.png` (bca.png, mandiri.png, dll)
4. Download ke folder: `C:\Users\ACE COMPUTER\BOTAXXX_TABUNGAN\dashboard\public\banks\`

### Opsi B: Via SCP Command (Git Bash/WSL)
```bash
# Ganti YOUR_VPS_IP dengan IP VPS kamu
scp root@YOUR_VPS_IP:/var/www/botaxxx/dashboard/public/banks/*.png ./dashboard/public/banks/
```

## Langkah 2: Commit ke Git

Setelah logo sudah di-download, jalankan command berikut:

```bash
# Add semua logo
git add dashboard/public/banks/*.png

# Commit
git commit -m "Add bank logos"

# Push ke GitHub
git push origin main
```

## Atau Commit Sekali Semua (Setelah Download)

```bash
git add dashboard/public/banks/
git commit -m "Add all bank logos"
git push origin main
```

