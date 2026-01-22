# Backend Bağlantı Kılavuzu

## 🚀 Hızlı Başlangıç

### 1. Backend URL'ini Yapılandırma

`src/config/api.js` dosyasını açın ve `API_BASE_URL` değişkenini kendi backend URL'inizle güncelleyin:

```javascript
const API_BASE_URL = 'http://localhost:3000/api'; // Local backend
// veya
const API_BASE_URL = 'http://172.20.10.3:3000/api'; // Local network IP
// veya
const API_BASE_URL = 'https://your-backend-api.com/api'; // Production
```

### 2. Backend CORS Ayarları

Backend'inizde CORS ayarlarını yapılandırın. Frontend origin'ini ekleyin:

**Express.js örneği:**
```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:19006',  // Expo web
    'http://localhost:8081',  // Expo dev server
    'exp://localhost:8081',   // Expo Go
  ],
  credentials: true
}));
```

**Django örneği:**
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:19006",
    "http://localhost:8081",
]
```

## 📱 HomeScreen Bağlantısı

HomeScreen otomatik olarak backend'e bağlanır. Aşağıdaki component'ler backend API'lerini kullanır:

### A. LoyaltyList Component
- **API Endpoint:** `GET /api/user/loyalty-info`
- **Service:** `userService.getUserLoyaltyInfo()`
- **Token Gereksinimi:** ✅ Evet (Bearer token)

### B. CafeSearch Component
- **API Endpoint:** `GET /api/cafes/search?q={query}`
- **Service:** `cafeService.searchCafes(query)`
- **Token Gereksinimi:** ✅ Evet (Bearer token)

### C. NearbyCafesMap Component
- **API Endpoint:** `GET /api/cafes/nearby?lat={lat}&lng={lng}&radius={radius}`
- **Service:** `cafeService.getNearbyCafes(latitude, longitude, radius)`
- **Token Gereksinimi:** ✅ Evet (Bearer token)

## 🔐 Authentication

Tüm API çağrıları (login/signup hariç) Bearer token gerektirir. Token, kullanıcı giriş yaptıktan sonra `AsyncStorage`'a kaydedilir.

## 🛠️ Backend API Endpoint'leri

### Authentication
- `POST /api/auth/signup` - Kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/forgot-password` - Şifre sıfırlama

### User
- `GET /api/user/profile` - Kullanıcı profili
- `PUT /api/user/update-profile` - Profil güncelleme
- `GET /api/user/loyalty-info` - Sadakat bilgileri

### Cafe
- `GET /api/cafes/search?q={query}` - Kafe arama
- `GET /api/cafes/nearby?lat={lat}&lng={lng}&radius={radius}` - Yakındaki kafeler

## ⚠️ Hata Çözümü

### CORS Hatası
```
Access to fetch at '...' has been blocked by CORS policy
```

**Çözüm:**
1. Backend CORS ayarlarını kontrol edin
2. Frontend origin'ini (http://localhost:19006) ekleyin
3. `src/config/api.js` dosyasındaki URL'in doğru olduğundan emin olun

### Network Hatası
```
Failed to fetch
```

**Çözüm:**
1. Backend sunucunuzun çalıştığından emin olun
2. `src/config/api.js` dosyasındaki URL'i kontrol edin
3. Firewall ayarlarını kontrol edin
4. Aynı network'te olduğunuzdan emin olun (local network için)

## 📝 Örnek Backend Response Formatları

### Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

### Loyalty Info Response
```json
[
  {
    "cafeId": 1,
    "cafeName": "Starbucks",
    "points": 150,
    "orders": 5
  }
]
```

### Cafe Search Response
```json
[
  {
    "id": 1,
    "name": "Starbucks",
    "address": "123 Main St",
    "latitude": 41.0082,
    "longitude": 28.9784
  }
]
```

## 🔄 Development İpuçları

1. **Local Backend:** `http://localhost:3000/api`
2. **Network Backend:** `http://YOUR_IP:3000/api` (IP'nizi öğrenmek için: `ipconfig` (Windows) veya `ifconfig` (Mac/Linux))
3. **Production:** Backend URL'inizi production domain'inizle değiştirin

## 📞 Destek

Sorun yaşıyorsanız:
1. Browser console'u kontrol edin
2. Network tab'inde API isteklerini inceleyin
3. Backend loglarını kontrol edin
4. `src/config/api.js` dosyasındaki URL'i doğrulayın











