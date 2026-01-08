# EAS Login ve Production APK Build Script
# Kullanım: Bu script'i çalıştırmadan önce terminal'de 'eas login' komutunu çalıştırın

Write-Host "`n=== Lucky Table - Production APK Build ===`n" -ForegroundColor Green

# EAS Login kontrolü
Write-Host "1. EAS Login durumu kontrol ediliyor..." -ForegroundColor Yellow
$loginStatus = eas whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ EAS CLI'ye login yapılmamış!" -ForegroundColor Red
    Write-Host "`nLütfen terminal'de şu komutu çalıştırın:" -ForegroundColor Yellow
    Write-Host "   eas login" -ForegroundColor Cyan
    Write-Host "`nEmail: omerfgeredeli" -ForegroundColor White
    Write-Host "Şifre: Omer1992" -ForegroundColor White
    Write-Host "`nLogin yaptıktan sonra bu script'i tekrar çalıştırın veya:" -ForegroundColor Yellow
    Write-Host "   npm run build:android:production" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ EAS CLI'ye login yapılmış: $loginStatus" -ForegroundColor Green

# Production APK Build
Write-Host "`n2. Production APK build başlatılıyor..." -ForegroundColor Yellow
Write-Host "   Bu işlem 20-25 dakika sürebilir...`n" -ForegroundColor Yellow

npm run build:android:production

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build başarıyla başlatıldı!" -ForegroundColor Green
    Write-Host "`nBuild durumunu takip etmek için:" -ForegroundColor Yellow
    Write-Host "   eas build:list" -ForegroundColor Cyan
    Write-Host "`nveya https://expo.dev adresinden takip edebilirsiniz.`n" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Build başlatılamadı. Lütfen hataları kontrol edin." -ForegroundColor Red
    exit 1
}





