# 🍀 Lucky Table

Lucky Table - Kafe sadakat programı mobil uygulaması

## 📱 Özellikler

- ✅ Kullanıcı kayıt ve giriş sistemi
- ✅ Kafe arama ve keşfetme
- ✅ Yakındaki kafeleri bulma (konum tabanlı)
- ✅ Sadakat puanları ve sipariş takibi
- ✅ Profil yönetimi
- ✅ Mock data desteği (backend olmadan test)

## 🚀 Hızlı Başlangıç

### Gereksinimler
- Node.js 16+
- npm veya yarn
- Expo CLI

### Kurulum
```bash
# Bağımlılıkları yükle
npm install

# Uygulamayı başlat
npm start
```

### Platformlar
```bash
# Web
npm run web
# veya
npx expo start --web

# Android
npm run android

# iOS
npm run ios
```

## 📦 Android APK Build

Android APK oluşturmak için detaylı kılavuz: [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md)

### Hızlı Komutlar:
```bash
# Preview APK (Test)
npm run build:android

# Production APK
npm run build:android:production

# Local Build
npm run build:android:local
```

## 🔧 Yapılandırma

### Backend Bağlantısı
Backend yapılandırması için: [BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md)

`src/config/api.js` dosyasında backend URL'ini yapılandırın:
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Mock Data
Varsayılan olarak mock data aktif. Backend yoksa otomatik kullanılır.

## 📁 Proje Yapısı

```
src/
├── components/      # Reusable component'ler
├── config/          # Yapılandırma dosyaları
├── context/         # React Context'ler
├── navigation/      # Navigation yapılandırması
├── screens/         # Ekranlar
│   ├── auth/        # Authentication ekranları
│   ├── home/         # Ana ekran ve component'leri
│   └── profile/      # Profil ekranı
├── services/         # API servisleri
├── theme/            # Tema (renkler, typography, vb.)
└── utils/            # Yardımcı fonksiyonlar
```

## 🎨 Tema

Uygulama yeşil ağırlıklı modern bir tema kullanır:
- Primary: `#2ECC71`
- Secondary: `#27AE60`
- Accent: `#1ABC9C`

## 📝 Dokümantasyon

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Kurulum ve kullanım kılavuzu
- [BACKEND_CONNECTION.md](./BACKEND_CONNECTION.md) - Backend bağlantı kılavuzu
- [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md) - Android APK build kılavuzu

## 🛠️ Geliştirme

### Mock Data Kullanımı
Mock data varsayılan olarak aktif. Backend bağlantısı yoksa otomatik kullanılır.

### Yeni Özellik Ekleme
1. İlgili service dosyasına API fonksiyonu ekleyin
2. Component'te kullanın
3. Mock data desteği ekleyin (opsiyonel)

## 📄 Lisans

Private - Tüm hakları saklıdır

## 👥 Destek

Sorularınız için dokümantasyon dosyalarına bakın veya issue açın.

---

**Versiyon:** 1.0.0  
**Son Güncelleme:** 2025-01-03

