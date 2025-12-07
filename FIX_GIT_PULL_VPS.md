# 🔧 Fix: Git Pull Error di VPS

## Problem

Error saat `git pull`:
```
error: Your local changes to the following files would be overwritten by merge:
        deploy-vps.sh
Please commit your changes or stash them before you merge.
Aborting.
```

## Solusi

### Opsi 1: Stash Perubahan Lokal (Recommended)

Jika Anda ingin menyimpan perubahan lokal untuk nanti:

```bash
cd ~/BOTAXXX_TABUNGAN

# Stash perubahan lokal
git stash

# Pull latest changes
git pull origin main

# Jika ingin mengembalikan perubahan yang di-stash
git stash pop
```

### Opsi 2: Discard Perubahan Lokal

Jika perubahan lokal tidak penting (misalnya hanya whitespace atau line ending):

```bash
cd ~/BOTAXXX_TABUNGAN

# Discard perubahan lokal
git restore deploy-vps.sh

# Atau gunakan checkout (untuk git versi lama)
# git checkout -- deploy-vps.sh

# Pull latest changes
git pull origin main
```

### Opsi 3: Commit Perubahan Lokal

Jika perubahan lokal penting dan ingin di-commit:

```bash
cd ~/BOTAXXX_TABUNGAN

# Check apa yang berubah
git diff deploy-vps.sh

# Jika perubahan penting, commit dulu
git add deploy-vps.sh
git commit -m "Update deploy-vps.sh"

# Pull (akan merge atau rebase)
git pull origin main

# Jika ada conflict, resolve dulu, lalu:
git add deploy-vps.sh
git commit -m "Merge conflict resolved"
```

### Opsi 4: Force Pull (Hati-hati!)

**⚠️ WARNING:** Ini akan menghapus semua perubahan lokal!

```bash
cd ~/BOTAXXX_TABUNGAN

# Reset ke remote (HAPUS SEMUA PERUBAHAN LOKAL!)
git fetch origin
git reset --hard origin/main
```

## Rekomendasi

Untuk VPS deployment, biasanya perubahan lokal tidak penting (hanya line ending atau whitespace). Gunakan **Opsi 2** untuk discard dan pull.

```bash
cd ~/BOTAXXX_TABUNGAN
git restore deploy-vps.sh
git pull origin main
```

## Verifikasi

Setelah pull berhasil:

```bash
# Check status
git status

# Check log
git log --oneline -5
```

---

**Note:** Error ini biasanya terjadi karena:
- Perbedaan line ending (LF vs CRLF) antara Windows dan Linux
- Perubahan whitespace
- File di-edit secara manual di VPS

