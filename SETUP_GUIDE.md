# 🚀 Uygulama Kurulum ve Kullanım Kılavuzu

## ✅ Hazır Durum

Uygulama şu anda **çalışmaya hazır** durumda! Tüm ayarlar yapıldı ve mock data desteği eklendi.

## 📋 Özellikler

### ✨ Otomatik Mock Data Desteği
- Backend yoksa otomatik olarak mock data kullanılır
- CORS veya network hatalarında otomatik fallback
- Development için hazır test verileri

### 🔧 Yapılandırma
- Merkezi API yapılandırması (`src/config/api.js`)
- Gelişmiş hata yönetimi
- Development modu desteği

## 🎯 Hızlı Başlangıç

### 1. Uygulamayı Başlatma

```bash
# Web'de çalıştır
npm start
# veya
npx expo start --web
```

### 2. Backend Bağlantısı (Opsiyonel)

Eğer backend'iniz varsa:

1. `src/config/api.js` dosyasını açın
2. `API_BASE_URL` değişkenini güncelleyin:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000/api';
   ```
3. Mock data'yı kapatmak için:
   ```javascript
   const USE_MOCK_DATA = false;
   ```

### 3. Mock Data Kullanımı (Varsayılan)

Mock data **varsayılan olarak aktif**. Backend yoksa otomatik kullanılır.

**Mock Data İçeriği:**
- ✅ Login/Signup (herhangi bir email/password ile giriş yapabilirsiniz)
- ✅ Loyalty bilgileri (3 kafe örneği)
- ✅ Kafe arama (4 kafe örneği)
- ✅ Yakındaki kafeler (3 kafe örneği)

## 📱 Kullanım

### Login/Signup
- Herhangi bir email ve password ile giriş yapabilirsiniz
- Mock data kullanıldığında her zaman başarılı olur

### HomeScreen
- **LoyaltyList**: Sipariş ve sadakat bilgilerini gösterir
- **CafeSearch**: Kafe arama yapabilirsiniz (örnek: "Starbucks", "Kahve")
- **NearbyCafesMap**: Konum izni vererek yakındaki kafeleri görebilirsiniz

## 🔄 Backend'e Geçiş

Backend hazır olduğunda:

1. `src/config/api.js` dosyasında:
   ```javascript
   const API_BASE_URL = 'http://your-backend-url.com/api';
   const USE_MOCK_DATA = false;
   ```

2. Backend CORS ayarlarında şu origin'leri ekleyin:
   - `http://localhost:19006` (Expo web)
   - `http://localhost:8081` (Expo dev server)

3. Uygulamayı yeniden başlatın

## 🛠️ Geliştirme

### Mock Data'yı Özelleştirme

`src/utils/mockData.js` dosyasını düzenleyerek mock verileri özelleştirebilirsiniz.

### Yeni API Endpoint Ekleme

1. İlgili service dosyasına yeni fonksiyon ekleyin
2. Mock data desteği ekleyin (opsiyonel)
3. Hata yönetimi ekleyin

## 📝 Dosya Yapısı

```
src/
├── config/
│   └── api.js              # API yapılandırması
├── services/
│   ├── authService.js      # Authentication servisleri
│   ├── cafeService.js       # Kafe servisleri
│   └── userService.js       # Kullanıcı servisleri
└── utils/
    └── mockData.js          # Mock data
```

## ⚠️ Önemli Notlar

1. **Mock Data Varsayılan Aktif**: Backend yoksa otomatik kullanılır
2. **Token Yönetimi**: Login sonrası token AsyncStorage'a kaydedilir
3. **Hata Yönetimi**: Network hatalarında otomatik mock data'ya geçiş yapılır
4. **Development Modu**: Console'da detaylı log'lar görünür

## 🐛 Sorun Giderme

### Uygulama açılmıyor
- `npm install` çalıştırın
- `npx expo start --clear` ile cache'i temizleyin

### Backend bağlantı hatası
- Mock data otomatik kullanılır, sorun yok
- Backend'e geçmek için `src/config/api.js` dosyasını kontrol edin

### CORS hatası
- Backend CORS ayarlarını kontrol edin
- Mock data kullanıyorsanız sorun yok

## 📞 Destek

Detaylı bilgi için `BACKEND_CONNECTION.md` dosyasına bakın.







