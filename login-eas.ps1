# EAS Login Script
# Email: cointurkomer@gmail.com
# Password: Omer123.

Write-Host "EAS CLI Login" -ForegroundColor Green
Write-Host "==============" -ForegroundColor Green
Write-Host ""
Write-Host "Email: cointurkomer@gmail.com"
Write-Host "Password: Omer123."
Write-Host ""
Write-Host "Login komutunu çalıştırıyorum..."
Write-Host ""

cd C:\Users\omerfaruk.geredeli\CursorProjects\lucky-table-mobile-ui

# EAS login komutunu çalıştır
# Not: Bu interaktif bir komut olduğu için manuel olarak email ve şifre girmeniz gerekecek
npx eas-cli login

Write-Host ""
Write-Host "Login tamamlandı. Durumu kontrol ediyorum..."
npx eas-cli whoami

