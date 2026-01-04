/**
 * API Configuration
 * Backend URL'ini buradan yapılandırın
 * 
 * Development için:
 * - Local backend: 'http://localhost:3000/api' veya 'http://YOUR_LOCAL_IP:3000/api'
 * - Production backend: 'https://your-backend-api.com/api'
 * 
 * Not: Backend CORS ayarlarında frontend origin'ini (http://localhost:19006) eklemelisiniz
 */

// ⚠️ BACKEND URL'İNİZİ BURAYA YAZIN ⚠️
// Örnekler:
// - Local: 'http://localhost:3000/api'
// - Local Network: 'http://172.20.10.3:3000/api' (kendi IP'nizi yazın)
// - Production: 'https://your-backend-api.com/api'
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * USE_MOCK_API Flag
 * 
 * Production build'de de mock kullanılabilir (EXPO_PUBLIC_USE_MOCK_API=true ile)
 * Development'ta varsayılan olarak true
 * 
 * true: Mock servisler kullanılır (backend bağlantısı yok)
 * false: Gerçek API servisler kullanılır
 * 
 * APK'da mock kullanmak için:
 * - EAS Build: eas.json'da environment variable ekle
 * - Local Build: .env dosyasında EXPO_PUBLIC_USE_MOCK_API=true
 */
const USE_MOCK_API = 
  process.env.EXPO_PUBLIC_USE_MOCK_API === 'true' 
    ? true 
    : process.env.EXPO_PUBLIC_USE_MOCK_API === 'false'
    ? false
    : (process.env.NODE_ENV === 'production' ? false : true); // Production'da varsayılan false, dev'de true

// Development modu (console log'ları gösterir)
const IS_DEVELOPMENT = __DEV__ || process.env.NODE_ENV !== 'production';

// Legacy support (geriye dönük uyumluluk için)
const USE_MOCK_DATA = USE_MOCK_API;

export { API_BASE_URL, USE_MOCK_API, USE_MOCK_DATA, IS_DEVELOPMENT };

