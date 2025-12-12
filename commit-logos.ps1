# Script untuk commit semua logo bank setelah di-download dari VPS
# Jalankan script ini SETELAH logo sudah di-download ke folder local

Write-Host "Checking for bank logos..." -ForegroundColor Yellow

$logoPath = ".\dashboard\public\banks\"
$pngFiles = Get-ChildItem -Path $logoPath -Filter "*.png" -ErrorAction SilentlyContinue

if ($pngFiles.Count -eq 0) {
    Write-Host "ERROR: No PNG files found in $logoPath" -ForegroundColor Red
    Write-Host "Please download logos from VPS first!" -ForegroundColor Red
    Write-Host ""
    Write-Host "VPS Path: /var/www/botaxxx/dashboard/public/banks/" -ForegroundColor Cyan
    Write-Host "Local Path: $logoPath" -ForegroundColor Cyan
    exit 1
}

Write-Host "Found $($pngFiles.Count) logo files" -ForegroundColor Green
Write-Host ""

# Add semua logo
Write-Host "Adding logos to git..." -ForegroundColor Yellow
git add dashboard/public/banks/*.png

# Check status
Write-Host ""
Write-Host "Git status:" -ForegroundColor Yellow
git status --short dashboard/public/banks/

# Commit
Write-Host ""
Write-Host "Committing..." -ForegroundColor Yellow
git commit -m "Add bank logos ($($pngFiles.Count) files)"

Write-Host ""
Write-Host "Done! Now push to GitHub with: git push origin main" -ForegroundColor Green

