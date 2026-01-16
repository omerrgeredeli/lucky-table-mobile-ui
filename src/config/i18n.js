import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import tr from '../locales/tr.json';
import en from '../locales/en.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import it from '../locales/it.json';
import ru from '../locales/ru.json';
import es from '../locales/es.json';
import ja from '../locales/ja.json';
import zhCN from '../locales/zh-CN.json';
import az from '../locales/az.json';

// Desteklenen diller
export const SUPPORTED_LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'az', name: 'Azərbaycan dili', flag: '🇦🇿' },
];

// Varsayılan dil - cihaz diline göre veya Türkçe
const getDefaultLanguage = async () => {
  try {
    // Önce kaydedilmiş dili kontrol et
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage)) {
        return savedLanguage;
      }
    } catch (storageError) {
      console.warn('AsyncStorage dil okuma hatası (non-critical):', storageError);
      // Devam et, cihaz dilini kullan
    }

    // Cihaz dilini al
    try {
      const locales = getLocales();
      const deviceLocale = locales && locales.length > 0 
        ? locales[0].languageCode || locales[0].languageTag?.split('-')[0] || 'tr'
        : 'tr';
      const supportedCode = SUPPORTED_LANGUAGES.find(lang => lang.code === deviceLocale);
      
      // Cihaz dili destekleniyorsa onu kullan, değilse Türkçe
      return supportedCode ? deviceLocale : 'tr';
    } catch (localeError) {
      console.warn('Cihaz dil algılama hatası (non-critical):', localeError);
      return 'tr';
    }
  } catch (error) {
    console.error('Dil algılama genel hatası:', error);
    return 'tr'; // Her durumda Türkçe döndür
  }
};

// i18n yapılandırması
const initI18n = async () => {
  let defaultLanguage = 'tr'; // Varsayılan
  
  try {
    defaultLanguage = await getDefaultLanguage();
  } catch (error) {
    console.warn('getDefaultLanguage hatası, varsayılan dil kullanılıyor:', error);
    defaultLanguage = 'tr';
  }

  return new Promise((resolve, reject) => {
    try {
      i18n
        .use(initReactI18next)
        .init({
          compatibilityJSON: 'v3',
          resources: {
            tr: { translation: tr },
            en: { translation: en },
            fr: { translation: fr },
            de: { translation: de },
            it: { translation: it },
            ru: { translation: ru },
            es: { translation: es },
            ja: { translation: ja },
            'zh-CN': { translation: zhCN },
            az: { translation: az },
          },
          lng: defaultLanguage,
          fallbackLng: 'tr',
          interpolation: {
            escapeValue: false, // React zaten escape ediyor
          },
          react: {
            useSuspense: false,
          },
        })
        .then(() => {
          resolve(i18n);
        })
        .catch((error) => {
          console.error('i18n init hatası:', error);
          // Hata olsa bile resolve et, uygulama çalışmaya devam etsin
          resolve(i18n);
        });
    } catch (error) {
      console.error('i18n init try-catch hatası:', error);
      // Hata olsa bile resolve et
      resolve(i18n);
    }
  });
};

export default initI18n;
