# 🔧 Fix: TypeScript Build Errors di VPS

## Problem

Error saat `npm run build`:
- Cannot find module errors
- Property 'env' does not exist on type 'ImportMeta'
- Unused variable errors

## Solusi

### 1. Pastikan Pull Latest Changes

```bash
cd /var/www/botaxxx
git config --global --add safe.directory /var/www/botaxxx
git pull origin main
```

### 2. Clear Cache dan Rebuild

```bash
cd /var/www/botaxxx/dashboard

# Clear node_modules dan cache
rm -rf node_modules package-lock.json .vite dist

# Reinstall dependencies
npm install

# Build lagi
npm run build
```

### 3. Verifikasi File vite-env.d.ts

Pastikan file `src/vite-env.d.ts` ada:

```bash
ls -la src/vite-env.d.ts
cat src/vite-env.d.ts
```

Harus berisi:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

### 4. Check TypeScript Config

```bash
cat tsconfig.json
```

Pastikan `include` berisi `["src/**/*"]` atau `["src"]`.

### 5. Build dengan Skip Type Check (Temporary)

Jika masih error dan butuh build cepat:

```bash
# Build tanpa type check (tidak direkomendasikan untuk production)
npm run build -- --mode production
```

Atau edit `package.json` sementara:
```json
"build": "vite build"
```

### 6. Full Clean Rebuild

```bash
cd /var/www/botaxxx/dashboard

# Full clean
rm -rf node_modules package-lock.json .vite dist .tsbuildinfo

# Reinstall
npm install

# Verify TypeScript version
npx tsc --version

# Build
npm run build
```

## Verifikasi

Setelah build berhasil:

```bash
# Check dist folder
ls -la dist/

# Harus ada:
# - index.html
# - assets/ folder
```

## Catatan

- Pastikan semua perubahan sudah ter-pull dari GitHub
- File `vite-env.d.ts` harus ada di `src/`
- TypeScript version harus compatible (4.9+)
- Node.js version harus 18+

---

**Jika masih error setelah semua langkah di atas, check:**
1. Git status: `git status`
2. File changes: `git diff`
3. Logs: `npm run build 2>&1 | tee build.log`

