# 🔄 Backend Entegrasyon Rehberi

Bu proje, Spring backend entegrasyonuna %100 uyumlu olacak şekilde tasarlanmıştır. Mock ve gerçek API arasında tek bir config ile geçiş yapılabilir.

## 📁 Mimari Yapı

```
src/
├── config/
│   └── api.js                    # USE_MOCK_API flag'i burada
├── services/
│   ├── authService.js            # Service switch layer
│   ├── userService.js            # Service switch layer
│   ├── cafeService.js             # Service switch layer
│   ├── mock/                     # Mock servisler
│   │   ├── authMockService.js
│   │   ├── userMockService.js
│   │   └── cafeMockService.js
│   └── api/                      # Gerçek API servisler
│       ├── authApiService.js
│       ├── userApiService.js
│       └── cafeApiService.js
└── screens/                      # Screen'ler sadece services/ kullanır
```

## ⚙️ Config Ayarları

### `src/config/api.js`

```javascript
// Production build'de otomatik olarak false olur
const USE_MOCK_API = 
  process.env.NODE_ENV === 'production' 
    ? false 
    : (process.env.EXPO_PUBLIC_USE_MOCK_API === 'true' || ...);

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
```

### Environment Variables

`.env` dosyası oluşturun (opsiyonel):

```env
EXPO_PUBLIC_USE_MOCK_API=false
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

## 🔁 Service Switch Mekanizması

Tüm servisler `USE_MOCK_API` flag'ine göre otomatik olarak mock veya gerçek API kullanır:

```javascript
// src/services/authService.js
import { USE_MOCK_API } from '../config/api';
import * as mockService from './mock/authMockService';
import * as apiService from './api/authApiService';

const getService = () => (USE_MOCK_API ? mockService : apiService);

export const login = async (email, password) => {
  const service = getService();
  const response = await service.login(email, password);
  // ...
};
```

## 📦 Response Contract

Tüm servisler standart response formatı kullanır:

```typescript
{
  success: boolean;
  data: any | null;
  error: {
    code: string;
    message: string;
  } | null;
}
```

### Örnek Başarılı Response

```javascript
{
  success: true,
  data: {
    token: "jwt_token_here",
    user: { id: 1, email: "test@example.com" }
  },
  error: null
}
```

### Örnek Hata Response

```javascript
{
  success: false,
  data: null,
  error: {
    code: "INVALID_EMAIL",
    message: "Geçerli bir email adresi giriniz"
  }
}
```

## 🔐 Auth Servisleri

### `login(email, password)`

```javascript
import { login } from '../services/authService';

try {
  const result = await login('test@example.com', 'password123');
  // result: { token, user }
} catch (error) {
  // error.message
}
```

### `signup(email, password)`

```javascript
import { signup } from '../services/authService';

try {
  const result = await signup('new@example.com', 'password123');
  // result: { token, user }
} catch (error) {
  // error.message
}
```

### `forgotPassword(email)`

```javascript
import { forgotPassword } from '../services/authService';

try {
  const result = await forgotPassword('test@example.com');
  // result: { message: "..." }
} catch (error) {
  // error.message
}
```

## 🏠 User Servisleri

### `getProfile()`

```javascript
import { getUserProfile } from '../services/userService';

try {
  const profile = await getUserProfile();
  // profile: { id, email, name, phone, ... }
} catch (error) {
  // error.message
}
```

### `updateProfile(profileData)`

```javascript
import { updateUserProfile } from '../services/userService';

try {
  const updated = await updateUserProfile({ name: 'New Name' });
  // updated: { id, email, name: 'New Name', ... }
} catch (error) {
  // error.message
}
```

### `getUserLoyaltyInfo()`

```javascript
import { getUserLoyaltyInfo } from '../services/userService';

try {
  const loyaltyData = await getUserLoyaltyInfo();
  // loyaltyData: Array<{ cafeId, cafeName, orderCount, ... }>
} catch (error) {
  // error.message
}
```

### `getHomeData()` ⭐ YENİ

```javascript
import { getHomeData } from '../services/userService';

try {
  const homeData = await getHomeData();
  // homeData: {
  //   loyaltyCafes: Array,      // İlk 5 sadakat bilgisi
  //   nearbyCafes: Array,        // Yakındaki kafeler
  //   totalOrders: number,       // Toplam sipariş sayısı
  //   totalCafes: number         // Toplam kafe sayısı
  // }
} catch (error) {
  // error.message
}
```

## ☕ Cafe Servisleri

### `searchCafes(searchQuery)`

```javascript
import { searchCafes } from '../services/cafeService';

try {
  const cafes = await searchCafes('Starbucks');
  // cafes: Array<{ id, name, address, ... }>
} catch (error) {
  // error.message
}
```

### `getNearbyCafes(latitude, longitude, radius)`

```javascript
import { getNearbyCafes } from '../services/cafeService';

try {
  const cafes = await getNearbyCafes(41.0082, 28.9784, 5000);
  // cafes: Array<{ id, name, address, distance, ... }>
} catch (error) {
  // error.message
}
```

## 📱 Screen Entegrasyonu Örneği

### Mevcut Screen (Değişiklik Gerektirmez)

```javascript
// src/screens/home/components/LoyaltyList.js
import { getUserLoyaltyInfo } from '../../../services/userService';

const fetchLoyaltyInfo = async () => {
  try {
    const data = await getUserLoyaltyInfo();
    setLoyaltyData(data || []);
  } catch (err) {
    Alert.alert('Hata', err.message);
  }
};
```

### Yeni getHomeData() Kullanımı

```javascript
// src/screens/home/HomeScreen.js
import { getHomeData } from '../../services/userService';

const HomeScreen = () => {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      const data = await getHomeData();
      setHomeData(data);
      // data.loyaltyCafes - İlk 5 sadakat bilgisi
      // data.nearbyCafes - Yakındaki kafeler
      // data.totalOrders - Toplam sipariş sayısı
      // data.totalCafes - Toplam kafe sayısı
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  // ...
};
```

## 🚀 Production Build

Production build'de `USE_MOCK_API` otomatik olarak `false` olur:

```bash
# Production build
npm run build:android:production

# Development (mock kullan)
EXPO_PUBLIC_USE_MOCK_API=true npm start

# Development (gerçek API kullan)
EXPO_PUBLIC_USE_MOCK_API=false npm start
```

## 🔧 Backend Entegrasyonu

### Spring Backend Endpoint'leri

Backend'iniz şu endpoint'leri sağlamalıdır:

#### Auth
- `POST /auth/login` - `{ email, password }` → `{ success, data: { token, user }, error }`
- `POST /auth/signup` - `{ email, password }` → `{ success, data: { token, user }, error }`
- `POST /auth/forgot-password` - `{ email }` → `{ success, data: { message }, error }`

#### User
- `GET /user/profile` - Headers: `Authorization: Bearer {token}` → `{ success, data: { id, email, name, ... }, error }`
- `PUT /user/update-profile` - Headers: `Authorization: Bearer {token}`, Body: `{ name, ... }` → `{ success, data: { ... }, error }`
- `GET /user/loyalty-info` - Headers: `Authorization: Bearer {token}` → `{ success, data: Array, error }`
- `GET /user/home` - Headers: `Authorization: Bearer {token}` → `{ success, data: { loyaltyCafes, nearbyCafes, ... }, error }`

#### Cafe
- `GET /cafes/search?q={query}` - Headers: `Authorization: Bearer {token}` → `{ success, data: Array, error }`
- `GET /cafes/nearby?lat={lat}&lng={lng}&radius={radius}` - Headers: `Authorization: Bearer {token}` → `{ success, data: Array, error }`

### Response Format

Backend'iniz standart response formatını kullanmalıdır:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

veya hata durumunda:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Hata mesajı"
  }
}
```

## ⚠️ Önemli Notlar

1. **Screen'lerde Mock/API Kontrolü YOK**: Screen'ler sadece `services/` katmanını kullanır, mock/API ayrımı yapmaz.

2. **Response Contract**: Tüm servisler standart response formatı kullanır. Screen'ler için backward compatibility sağlanmıştır (hata durumunda throw edilir).

3. **Token Yönetimi**: Token'lar `AsyncStorage`'da saklanır ve otomatik olarak API çağrılarında header'a eklenir.

4. **Error Handling**: Tüm servisler hata durumunda standart error objesi döner. Screen'ler için throw edilir.

5. **Production Ready**: Production build'de otomatik olarak gerçek API kullanılır.

## 📝 Checklist

- [x] Config dosyası güncellendi (`USE_MOCK_API` flag)
- [x] Mock servisler oluşturuldu (`services/mock/`)
- [x] Real API servisler oluşturuldu (`services/api/`)
- [x] Service switch mekanizması eklendi
- [x] Response contract standardize edildi
- [x] `getHomeData()` servisi eklendi
- [x] Mevcut servisler refactor edildi
- [x] Backward compatibility sağlandı

## 🎯 Sonuç

Artık projeniz Spring backend entegrasyonuna hazır! Tek yapmanız gereken:

1. `src/config/api.js` dosyasında `API_BASE_URL`'i güncellemek
2. Backend'inizin standart response formatını kullanmasını sağlamak
3. Production build almak (otomatik olarak gerçek API kullanılır)

Mock ve gerçek API arasında geçiş yapmak için sadece `USE_MOCK_API` flag'ini değiştirmeniz yeterli!

