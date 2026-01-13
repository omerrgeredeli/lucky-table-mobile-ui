# 🔐 EAS CLI Login - Lucky Table

## ⚠️ ÖNEMLİ: Manuel Login Gerekli

EAS CLI login komutu interaktif olduğu için terminal'de manuel olarak çalıştırmanız gerekiyor.

## 📋 Login Adımları

### 1. Terminal'de Login Komutunu Çalıştırın

```bash
eas login
```

### 2. İstenen Bilgileri Girin

Komut çalıştığında sizden şunlar istenecek:

**Email veya kullanıcı adı:**
```
omerfgeredeli
```

**Şifre:**
```
Omer1992.
```
⚠️ **DİKKAT:** Şifre sonunda nokta (.) var: `Omer1992.`

### 3. Login Başarılı Olduğunda

Login başarılı olduğunda şu mesajı göreceksiniz:
```
✅ Successfully logged in as omerfgeredeli
```

## 🚀 Login Sonrası Production APK Build

Login yaptıktan sonra şu komutu çalıştırın:

```bash
npm run build:android:production
```

veya

```bash
npx eas-cli@latest build --platform android --profile production
```

## 🔍 Login Durumunu Kontrol Etme

Login yapıp yapmadığınızı kontrol etmek için:

```bash
eas whoami
```

Eğer login yaptıysanız, kullanıcı adınız görünecek.

## ❌ Sorun Giderme

### "Not logged in" Hatası
- Login komutunu tekrar çalıştırın
- Email ve şifrenin doğru olduğundan emin olun
- Şifre sonundaki noktayı (.) unutmayın

### "Invalid credentials" Hatası
- Email: `omerfgeredeli`
- Şifre: `Omer1992.` (sonunda nokta var)
- Büyük/küçük harf duyarlılığına dikkat edin

## 📝 Özet

1. Terminal'de: `eas login`
2. Email: `omerfgeredeli`
3. Şifre: `Omer1992.` (sonunda nokta)
4. Login sonrası: `npm run build:android:production`

---

**Not:** EAS CLI login komutu güvenlik nedeniyle interaktif modda çalışır ve komut satırından direkt email/şifre ile login yapılamaz.






