import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';
import { SUPPORTED_LANGUAGES } from '../config/i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'tr');
  const [isLanguageSelected, setIsLanguageSelected] = useState(false);
  const [isCheckingLanguage, setIsCheckingLanguage] = useState(true);

  // İlk açılışta dil seçimi kontrolü
  useEffect(() => {
    checkLanguageSelection();
    
    // i18n dil değişikliğini dinle
    const handleLanguageChange = (lng) => {
      setCurrentLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  const checkLanguageSelection = async () => {
    try {
      const hasSelectedLanguage = await AsyncStorage.getItem('app_language_selected');
      const savedLanguage = await AsyncStorage.getItem('app_language');
      
      if (savedLanguage && SUPPORTED_LANGUAGES.find(lang => lang.code === savedLanguage)) {
        setCurrentLanguage(savedLanguage);
      }
      
      setIsLanguageSelected(hasSelectedLanguage === 'true');
    } catch (error) {
      console.error('Dil seçimi kontrolü hatası:', error);
      setIsLanguageSelected(false);
    } finally {
      setIsCheckingLanguage(false);
    }
  };

  // Dil değiştirme
  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      await AsyncStorage.setItem('app_language', languageCode);
      setCurrentLanguage(languageCode);
      return true;
    } catch (error) {
      console.error('Dil değiştirme hatası:', error);
      return false;
    }
  };

  // Dil seçimini kaydet (ilk açılış için)
  const saveLanguageSelection = async (languageCode) => {
    try {
      await changeLanguage(languageCode);
      await AsyncStorage.setItem('app_language_selected', 'true');
      setIsLanguageSelected(true);
      return true;
    } catch (error) {
      console.error('Dil seçimi kaydetme hatası:', error);
      return false;
    }
  };

  // Mevcut dil bilgisi
  const getCurrentLanguageInfo = () => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  };

  const value = {
    currentLanguage,
    isLanguageSelected,
    isCheckingLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    changeLanguage,
    saveLanguageSelection,
    getCurrentLanguageInfo,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
