import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { PermissionProvider } from './src/context/PermissionContext';
import AppNavigator from './src/navigation/AppNavigator';
import initI18n from './src/config/i18n';
import { colors } from './src/theme';

/**
 * Deprecated uyarılarını filtrele (Web için)
 * React Native Web'in Image component'i deprecated prop'lar kullanıyor
 */
if (Platform.OS === 'web' && __DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('Image: style.resizeMode is deprecated') ||
       message.includes('Image: style.tintColor is deprecated') ||
       message.includes('Animated: `useNativeDriver` is not supported') ||
       message.includes('props.pointerEvents is deprecated') ||
       message.includes('shadow') && message.includes('deprecated'))
    ) {
      // Bu uyarıları görmezden gel
      return;
    }
    originalWarn.apply(console, args);
  };
}

/**
 * Ana Uygulama Entry Point
 * i18n başlatıldıktan sonra uygulamayı render eder
 */
export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initI18n();
        setI18nReady(true);
      } catch (error) {
        console.error('i18n başlatma hatası:', error);
        setI18nReady(true); // Hata olsa bile uygulamayı göster
      }
    };

    initializeApp();
  }, []);

  if (!i18nReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <PermissionProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </AuthProvider>
      </PermissionProvider>
    </LanguageProvider>
  );
}

