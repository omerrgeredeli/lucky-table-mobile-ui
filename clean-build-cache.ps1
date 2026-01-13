# Android Build Cache Temizleme Script
# Bu script tüm build cache'lerini temizler ve clean build için hazırlar

Write-Host "`n=== Android Build Cache Temizleme ===`n" -ForegroundColor Green

# Android build klasörlerini temizle
Write-Host "1. Android build klasörleri temizleniyor..." -ForegroundColor Yellow

$buildPaths = @(
    "android/app/build",
    "android/build",
    "android/.gradle",
    "android/app/.cxx",
    "android/.idea",
    "android/local.properties"
)

foreach ($path in $buildPaths) {
    if (Test-Path $path) {
        Write-Host "   Temizleniyor: $path" -ForegroundColor Cyan
        Remove-Item -Recurse -Force $path -ErrorAction SilentlyContinue
        Write-Host "   ✅ Temizlendi: $path" -ForegroundColor Green
    } else {
        Write-Host "   ⏭️  Zaten temiz: $path" -ForegroundColor Gray
    }
}

# Gradle cache temizle (opsiyonel - daha agresif temizlik)
Write-Host "`n2. Gradle cache temizleniyor..." -ForegroundColor Yellow
if (Test-Path "android") {
    Push-Location android
    try {
        & gradlew clean 2>&1 | Out-Null
        Write-Host "   ✅ Gradle clean tamamlandı" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️  Gradle clean çalıştırılamadı (normal olabilir)" -ForegroundColor Yellow
    }
    Pop-Location
}

# Node modules cache temizle (opsiyonel)
Write-Host "`n3. Metro bundler cache temizleniyor..." -ForegroundColor Yellow
if (Test-Path ".expo") {
    Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue
    Write-Host "   ✅ .expo cache temizlendi" -ForegroundColor Green
}

Write-Host "`n✅ Build cache temizleme tamamlandı!" -ForegroundColor Green
Write-Host "`nArtık clean build yapabilirsiniz:" -ForegroundColor Yellow
Write-Host "   npm run build:android" -ForegroundColor Cyan
Write-Host "   npm run build:android:production" -ForegroundColor Cyan
Write-Host ""

