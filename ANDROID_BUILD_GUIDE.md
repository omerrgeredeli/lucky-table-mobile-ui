# 📱 Android APK Build Kılavuzu - Lucky Table

Bu kılavuz, Lucky Table uygulamasını Android APK olarak build etmek için gereken tüm adımları içerir.

## ✅ Ön Gereksinimler

### 1. Node.js ve npm
- Node.js 16+ yüklü olmalı
- npm veya yarn yüklü olmalı

### 2. Expo CLI
```bash
npm install -g expo-cli
```

### 3. EAS CLI (Expo Application Services)
```bash
npm install -g eas-cli
```

### 4. Expo Hesabı
- [Expo](https://expo.dev) hesabı oluşturun (ücretsiz)
- EAS Build kullanmak için gerekli

## 🚀 Hızlı Başlangıç

### Adım 1: Bağımlılıkları Yükleyin
```bash
npm install
```

### Adım 2: EAS CLI ile Giriş Yapın
```bash
eas login
```

### Adım 3: EAS Build Yapılandırmasını Başlatın (İlk Kez)
```bash
eas build:configure
```

Bu komut `eas.json` dosyasını oluşturur (zaten oluşturuldu).

## 📦 APK Build Komutları

### 1. Preview APK (Test için - Önerilen)
```bash
npm run build:android
```
veya
```bash
eas build --platform android --profile preview
```

**Özellikler:**
- APK formatında
- Internal distribution
- Test için idealdir
- Google Play Store'a yüklenemez

### 2. Production APK
```bash
npm run build:android:production
```
veya
```bash
eas build --platform android --profile production
```

**Özellikler:**
- APK formatında
- Production için optimize edilmiş
- Google Play Store'a yüklenebilir

### 3. Local Build (Kendi Bilgisayarınızda)
```bash
npm run build:android:local
```
veya
```bash
eas build --platform android --local --profile preview
```

**Not:** Local build için Android SDK ve gerekli araçlar yüklü olmalıdır.

## 📋 Build Süreci

1. **Build Başlatma:** Komut çalıştırıldığında EAS sunucularında build başlar
2. **Build URL:** Terminal'de build URL'i görünecek
3. **İlerleme Takibi:** [expo.dev](https://expo.dev) hesabınızdan build durumunu takip edebilirsiniz
4. **APK İndirme:** Build tamamlandığında APK dosyasını indirebilirsiniz

## 🔧 Yapılandırma Dosyaları

### app.json
- `android.package`: `com.luckytable.app`
- `android.versionCode`: 1 (her build'de artırın)
- `version`: `1.0.0` (kullanıcıya görünen versiyon)

### eas.json
- `preview`: Test APK için
- `production`: Production APK için

## 📱 APK Yükleme

### Android Cihaza Yükleme

1. **USB ile:**
   ```bash
   adb install path/to/app.apk
   ```

2. **Manuel:**
   - APK dosyasını Android cihaza kopyalayın
   - Dosya yöneticisinden APK'yı açın
   - "Bilinmeyen kaynaklardan yükleme" izni verin
   - Yükleme işlemini tamamlayın

## 🔄 Versiyon Güncelleme

Her yeni build için `app.json` dosyasında versiyon numarasını güncelleyin:

```json
{
  "expo": {
    "version": "1.0.1",  // Kullanıcıya görünen versiyon
    "android": {
      "versionCode": 2  // Her build'de +1 artırın
    }
  }
}
```

## ⚙️ Build Profilleri

### Preview Profile
- **Kullanım:** Test ve geliştirme
- **Format:** APK
- **Distribution:** Internal
- **Süre:** ~15-20 dakika

### Production Profile
- **Kullanım:** Production release
- **Format:** APK
- **Distribution:** Production
- **Süre:** ~20-25 dakika

## 🐛 Sorun Giderme

### Build Başarısız Olursa

1. **Logları Kontrol Edin:**
   ```bash
   eas build:list
   ```
   Build ID ile detaylı logları görüntüleyin

2. **Yapılandırmayı Kontrol Edin:**
   - `app.json` dosyasını kontrol edin
   - `eas.json` dosyasını kontrol edin
   - Icon ve splash screen dosyalarının mevcut olduğundan emin olun

3. **Cache Temizleme:**
   ```bash
   expo start --clear
   ```

### Icon/Splash Screen Sorunları

Icon ve splash screen dosyaları `assets/` klasöründe olmalı:
- `icon.png` (1024x1024)
- `splash.png` (1242x2436)
- `adaptive-icon.png` (1024x1024)

## 📊 Build Durumu Kontrolü

```bash
# Tüm build'leri listele
eas build:list

# Belirli bir build'in durumunu kontrol et
eas build:view [BUILD_ID]
```

## 🔐 Güvenlik Notları

- **Keystore:** Production build'ler için otomatik keystore oluşturulur
- **Keystore Yedekleme:** EAS otomatik olarak yedekler, ancak manuel yedekleme önerilir
- **Package Name:** `com.luckytable.app` - değiştirmek isterseniz `app.json`'da güncelleyin

## 📝 Önemli Notlar

1. **İlk Build:** İlk build daha uzun sürebilir (~25-30 dakika)
2. **Sonraki Build'ler:** Daha hızlı olur (~15-20 dakika)
3. **Build Limitleri:** Ücretsiz Expo hesabında aylık build limiti vardır
4. **APK Boyutu:** Genellikle 20-50 MB arası olur

## 🎯 Hızlı Komutlar Özeti

```bash
# EAS'a giriş
eas login

# Preview APK build
npm run build:android

# Production APK build
npm run build:android:production

# Local build
npm run build:android:local

# Build listesi
eas build:list

# Build durumu
eas build:view [BUILD_ID]
```

## 📞 Destek

- [Expo Dokümantasyonu](https://docs.expo.dev)
- [EAS Build Dokümantasyonu](https://docs.expo.dev/build/introduction/)
- [Expo Community](https://forums.expo.dev)

---

**Son Güncelleme:** 2025-01-03
**Uygulama:** Lucky Table v1.0.0

