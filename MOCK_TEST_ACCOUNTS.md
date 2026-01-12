# Mock Test Account Bilgileri

Bu dosya mock verilerle test yaparken kullanabileceğiniz test hesaplarını içerir.

## Customer Account (Müşteri)

- **Email:** `test@example.com`
- **Şifre:** `password123`
- **Role:** `customer`
- **Telefon:** `5551234567`

## Business Account (İşletme)

- **Email:** `business@example.com`
- **Şifre:** `Business123!`
- **Role:** `user` (business)
- **Telefon:** `5557654321`

### Şifre Validation Kuralları

Business account şifresi aşağıdaki tüm kuralları karşılar:
- ✅ En az 8 karakter
- ✅ En az 1 büyük harf (B)
- ✅ En az 1 küçük harf (usiness)
- ✅ En az 1 rakam (123)
- ✅ En az 1 özel karakter (!)

## Notlar

- Bu hesaplar sadece mock/test ortamında çalışır
- Gerçek API'ye geçildiğinde bu hesaplar kullanılamaz
- Business account ile giriş yaptığınızda BusinessHomeScreen açılır
- Customer account ile giriş yaptığınızda normal customer flow açılır

