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
// - Backend yoksa: null (mock data kullanılır)
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// Development modunda mock data kullanmak için
// Backend yoksa veya test için true yapın
// Varsayılan: true (backend yoksa otomatik mock data kullanılır)
const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA !== 'false';

// Development modu (console log'ları gösterir)
const IS_DEVELOPMENT = __DEV__ || process.env.NODE_ENV !== 'production';

export { API_BASE_URL, USE_MOCK_DATA, IS_DEVELOPMENT };

