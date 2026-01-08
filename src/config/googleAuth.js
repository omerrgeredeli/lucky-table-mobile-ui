/**
 * Google OAuth Configuration
 * Production ve Development için ayrı client ID'ler ve secret'lar
 * 
 * Development: Hardcoded değerler kullanılır (mevcut client ID'ler)
 * Production: Environment variable'lar ile override edilebilir
 */

// Development Google OAuth Client IDs
// These should be set via environment variables in production
const DEV_GOOGLE_CLIENT_IDS = {
  android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID_DEV || '',
  ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS_DEV || '',
  web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB_DEV || '',
};

const DEV_GOOGLE_CLIENT_SECRET = {
  web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET_WEB_DEV || '',
};

// Production Google OAuth Client IDs
// ⚠️ Production client ID'lerinizi environment variable'larda tanımlayın
// Örnek: EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID=your-prod-android-client-id
const PROD_GOOGLE_CLIENT_IDS = {
  android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID || DEV_GOOGLE_CLIENT_IDS.android,
  ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS || DEV_GOOGLE_CLIENT_IDS.ios,
  web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || DEV_GOOGLE_CLIENT_IDS.web,
};

const PROD_GOOGLE_CLIENT_SECRET = {
  web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET_WEB || DEV_GOOGLE_CLIENT_SECRET.web,
};

// Environment kontrolü
// EXPO_PUBLIC_ENV=production ile production modu aktif edilir
// Veya NODE_ENV=production ile
const IS_PRODUCTION = 
  process.env.EXPO_PUBLIC_ENV === 'production' || 
  process.env.NODE_ENV === 'production';
const IS_DEVELOPMENT = !IS_PRODUCTION;

// Aktif config seçimi
// Production modunda environment variable'lar varsa onları kullan, yoksa development değerlerini kullan
const GOOGLE_CLIENT_IDS = IS_PRODUCTION ? PROD_GOOGLE_CLIENT_IDS : DEV_GOOGLE_CLIENT_IDS;
const GOOGLE_CLIENT_SECRET = IS_PRODUCTION ? PROD_GOOGLE_CLIENT_SECRET : DEV_GOOGLE_CLIENT_SECRET;

export {
  GOOGLE_CLIENT_IDS,
  GOOGLE_CLIENT_SECRET,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
};

