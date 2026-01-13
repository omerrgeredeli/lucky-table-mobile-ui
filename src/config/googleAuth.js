/**
 * Google OAuth Configuration
 * Production ve Development için ayrı client ID'ler ve secret'lar
 * 
 * Development: Hardcoded değerler kullanılır (mevcut client ID'ler)
 * Production: Environment variable'lar ile override edilebilir
 */

// Development Google OAuth Client IDs
// These should be set via environment variables in production
// ⚠️ ÖNEMLİ: Web için MUTLAKA web-specific client ID kullanılmalı
// iOS client ID web'de çalışmaz (farklı client type)
const DEV_GOOGLE_CLIENT_IDS = {
  android: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID_DEV || '974864364834-fkjcf8o8a0algg9r4it6inhos2huq888.apps.googleusercontent.com',
  ios: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS_DEV || '974864364834-j7cjkpj7qe5v6nno6dh9r0hniiiihqlf.apps.googleusercontent.com',
  // Web için: Web application tipinde client ID (environment variable ile override edilebilir)
  web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB_DEV || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB || '974864364834-124ddsnnikhogat55vdaes5ed0cn6qfr.apps.googleusercontent.com',
};

const DEV_GOOGLE_CLIENT_SECRET = {
  // Web için: Client secret (environment variable ile override edilebilir)
  // NOT: Client secret'ı kullanıcıdan alınmalı ve güvenli bir şekilde saklanmalı
  web: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET_WEB_DEV || process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET_WEB || '',
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

