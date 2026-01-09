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

// Desteklenen diller
export const SUPPORTED_LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
];

// Varsayılan dil - cihaz diline göre veya Türkçe
const getDefaultLanguage = async () => {
  try {
    // Önce kaydedilmiş dili kontrol et
    const savedLanguage = await AsyncStorage.getItem('app_language');
    if (savedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage)) {
      return savedLanguage;
    }

    // Cihaz dilini al
    const locales = getLocales();
    const deviceLocale = locales && locales.length > 0 
      ? locales[0].languageCode || locales[0].languageTag?.split('-')[0] || 'tr'
      : 'tr';
    const supportedCode = SUPPORTED_LANGUAGES.find(lang => lang.code === deviceLocale);
    
    // Cihaz dili destekleniyorsa onu kullan, değilse Türkçe
    return supportedCode ? deviceLocale : 'tr';
  } catch (error) {
    console.error('Dil algılama hatası:', error);
    return 'tr';
  }
};

// i18n yapılandırması
const initI18n = async () => {
  const defaultLanguage = await getDefaultLanguage();

  return new Promise((resolve) => {
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
      });
  });
};

export default initI18n;
