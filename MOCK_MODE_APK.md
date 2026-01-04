# 📱 Mock Mode - APK Build Kullanımı

## 🎯 Mock Mode Nedir?

Mock mode, gerçek backend API'ye bağlanmadan uygulamayı test etmenizi sağlar. Tüm veriler in-memory olarak saklanır ve gerçekçi bir test ortamı sunar.

## ✅ APK'da Mock Mode Aktif

APK build'lerinde mock mode **varsayılan olarak aktif** durumdadır. Bu sayede:
- ✅ Network request failed hataları olmaz
- ✅ Backend bağlantısı gerektirmez
- ✅ Tablet/telefonda test edebilirsiniz
- ✅ Gerçekçi kullanıcı akışlarını test edebilirsiniz

## 🔧 Mock Mode Ayarları

### Otomatik Ayarlar (APK Build)

`eas.json` dosyasında preview ve production build'ler için mock mode aktif:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_USE_MOCK_API": "true"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_USE_MOCK_API": "true"
      }
    }
  }
}
```

### Manuel Değiştirme

Mock mode'u kapatmak için `eas.json`'da `"EXPO_PUBLIC_USE_MOCK_API": "false"` yapın.

## 📋 Mock Mode Özellikleri

### ✅ Çalışan Özellikler

1. **Kullanıcı Kaydı (Signup)**
   - Email, şifre ve telefon ile kayıt
   - Başarılı kayıt sonrası login ekranına yönlendirme
   - Duplicate email kontrolü

2. **Giriş (Login)**
   - Email veya telefon + şifre ile giriş
   - Aktivasyon kodu akışı
   - Hata mesajları (kullanıcı bulunamadı, şifre yanlış)

3. **Profil Yönetimi**
   - Profil bilgilerini görüntüleme
   - Email, telefon, şifre güncelleme
   - Bildirim ayarları
   - Üyelik iptali

4. **In-Memory Veri Saklama**
   - Kayıt olan kullanıcılar session boyunca saklanır
   - Profil güncellemeleri kalıcı (session içinde)
   - Üyelik iptali ile kullanıcı silinir

### ⚠️ Sınırlamalar

- Veriler sadece session boyunca kalıcı (uygulama kapanınca silinir)
- Gerçek backend entegrasyonu yok
- Network istekleri yapılmaz

## 🚀 APK Build

Mock mode ile APK build:

```bash
# Preview build (mock mode aktif)
eas build --platform android --profile preview

# Production build (mock mode aktif)
eas build --platform android --profile production
```

## 🔄 Real API'ye Geçiş

Mock mode'u kapatıp gerçek API'ye geçmek için:

1. `eas.json`'da `EXPO_PUBLIC_USE_MOCK_API` değerini `"false"` yapın
2. `src/config/api.js`'de `API_BASE_URL`'i gerçek backend URL'inize ayarlayın
3. Yeni build alın

## 📝 Notlar

- Mock mode development ve production build'lerinde varsayılan olarak aktif
- Gerçek API entegrasyonu için mock mode'u kapatmanız gerekir
- Mock mode'da tüm veriler in-memory saklanır, uygulama kapanınca silinir

