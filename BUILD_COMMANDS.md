# 🚀 Android APK Build Komutları - Lucky Table

## ⚡ Hızlı Başlangıç

### 1. EAS CLI Kurulumu (İlk Kez)
```bash
npm install -g eas-cli
```

### 2. Expo Hesabına Giriş
```bash
eas login
```

### 3. Build Yapılandırması (İlk Kez - Opsiyonel)
```bash
eas build:configure
```
*Not: `eas.json` dosyası zaten oluşturuldu, bu adım opsiyonel.*

## 📦 APK Build Komutları

### ✅ Preview APK (Test için - ÖNERİLEN)
```bash
npm run build:android
```
veya
```bash
eas build --platform android --profile preview
```

**Süre:** ~15-20 dakika  
**Format:** APK  
**Kullanım:** Test ve geliştirme için

---

### ✅ Production APK
```bash
npm run build:android:production
```
veya
```bash
eas build --platform android --profile production
```

**Süre:** ~20-25 dakika  
**Format:** APK  
**Kullanım:** Production release için

---

### ✅ Local Build (Kendi Bilgisayarınızda)
```bash
npm run build:android:local
```
veya
```bash
eas build --platform android --local --profile preview
```

**Not:** Local build için Android SDK gerekli.  
**Süre:** Sistem performansına bağlı

---

## 📊 Build Durumu Kontrolü

### Build Listesi
```bash
eas build:list
```

### Belirli Build Durumu
```bash
eas build:view [BUILD_ID]
```

### Build Logları
```bash
eas build:view [BUILD_ID] --logs
```

---

## 📱 APK İndirme ve Yükleme

### 1. Build Tamamlandıktan Sonra
- Terminal'de build URL'i görünecek
- Veya [expo.dev](https://expo.dev) hesabınızdan indirebilirsiniz

### 2. Android Cihaza Yükleme

**USB ile:**
```bash
adb install path/to/app.apk
```

**Manuel:**
1. APK dosyasını Android cihaza kopyalayın
2. Dosya yöneticisinden APK'yı açın
3. "Bilinmeyen kaynaklardan yükleme" izni verin
4. Yükleme işlemini tamamlayın

---

## 🔄 Versiyon Güncelleme

Her yeni build için `app.json` dosyasını güncelleyin:

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

---

## ⚙️ Build Profilleri

### Preview Profile
- **Build Type:** APK
- **Distribution:** Internal
- **Kullanım:** Test
- **Süre:** ~15-20 dakika

### Production Profile
- **Build Type:** APK
- **Distribution:** Production
- **Kullanım:** Release
- **Süre:** ~20-25 dakika

---

## 🐛 Sorun Giderme

### Build Başarısız Olursa
```bash
# Build loglarını kontrol et
eas build:view [BUILD_ID] --logs

# Yapılandırmayı kontrol et
cat app.json
cat eas.json
```

### Cache Temizleme
```bash
expo start --clear
```

### EAS CLI Güncelleme
```bash
npm install -g eas-cli@latest
```

---

## 📝 Önemli Notlar

1. **İlk Build:** Daha uzun sürebilir (~25-30 dakika)
2. **Sonraki Build'ler:** Daha hızlı (~15-20 dakika)
3. **Build Limitleri:** Ücretsiz Expo hesabında aylık limit vardır
4. **APK Boyutu:** Genellikle 20-50 MB arası
5. **Internet Bağlantısı:** Build sırasında internet gerekli

---

## 🎯 Tüm Komutlar Özeti

```bash
# EAS CLI kurulumu
npm install -g eas-cli

# Giriş
eas login

# Preview APK
npm run build:android

# Production APK
npm run build:android:production

# Local build
npm run build:android:local

# Build listesi
eas build:list

# Build durumu
eas build:view [BUILD_ID]
```

---

**Detaylı bilgi için:** [ANDROID_BUILD_GUIDE.md](./ANDROID_BUILD_GUIDE.md)






