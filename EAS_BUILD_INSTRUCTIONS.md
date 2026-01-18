# 🚀 EAS Build - Production APK Oluşturma

## ⚠️ ÖNEMLİ: EAS CLI Login Gerekli

Production APK build etmek için önce EAS CLI'ye giriş yapmanız gerekiyor.

## 📋 Adım Adım Talimatlar

### 1. EAS CLI'ye Giriş Yapın

Terminal'de şu komutu çalıştırın:
```bash
eas login
```

Bu komut sizden:
- Email veya kullanıcı adı
- Şifre

isteyecektir. [Expo.dev](https://expo.dev) hesabınız yoksa önce hesap oluşturun.

### 2. Proje ID'sini Yapılandırın (Opsiyonel)

Proje ID'niz: `73f7eb31-742c-4dd6-8447-61a7a6a3a224`

Eğer bu ID'yi kullanmak istiyorsanız, `app.json` dosyasına ekleyebilirsiniz:
```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "73f7eb31-742c-4dd6-8447-61a7a6a3a224"
      }
    }
  }
}
```

### 3. Production APK Build

Login yaptıktan sonra şu komutu çalıştırın:

```bash
npx eas-cli@latest build --platform android --profile production
```

veya npm script kullanarak:

```bash
npm run build:android:production
```

## 🔄 Alternatif: Manuel Build Başlatma

Eğer login yaptıysanız, direkt build komutunu çalıştırabilirsiniz:

```bash
# Production APK
npx eas-cli@latest build --platform android --profile production

# Preview APK (Test)
npx eas-cli@latest build --platform android --profile preview
```

## 📊 Build Durumu

Build başladıktan sonra:
1. Terminal'de build URL'i görünecek
2. [expo.dev](https://expo.dev) hesabınızdan build durumunu takip edebilirsiniz
3. Build tamamlandığında APK dosyasını indirebilirsiniz

## ⏱️ Beklenen Süre

- İlk build: ~25-30 dakika
- Sonraki build'ler: ~20-25 dakika

## 🎯 Hızlı Komutlar

```bash
# 1. Login
eas login

# 2. Production APK Build
npm run build:android:production

# 3. Build Durumu
eas build:list
```

---

**Not:** EAS CLI login interaktif bir komut olduğu için terminal'de manuel olarak çalıştırmanız gerekiyor.







