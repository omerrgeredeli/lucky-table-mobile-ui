import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { PermissionProvider } from './src/context/PermissionContext';
import AppNavigator from './src/navigation/AppNavigator';
import initI18n from './src/config/i18n';
import { colors } from './src/theme';

// Debug log - safe import
let addLog;
try {
  const debugModule = require('./src/components/DebugOverlay');
  addLog = debugModule.addLog;
} catch (error) {
  addLog = () => {}; // No-op if module fails
}

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
      // Debug log - sadece development/preview modunda
      if ((__DEV__ || process.env.NODE_ENV !== 'production') && addLog) {
        try {
          addLog('Uygulama başlatılıyor...', 'info');
          addLog(`Platform: ${Platform.OS}`, 'info');
        } catch (e) {
          console.warn('addLog error:', e);
        }
      }

      try {
        await initI18n();
        
        if ((__DEV__ || process.env.NODE_ENV !== 'production') && addLog) {
          try {
            addLog('i18n başlatıldı', 'success');
          } catch (e) {
            console.warn('addLog error:', e);
          }
        }
        
        setI18nReady(true);
        
        if ((__DEV__ || process.env.NODE_ENV !== 'production') && addLog) {
          try {
            addLog('Uygulama hazır', 'success');
          } catch (e) {
            console.warn('addLog error:', e);
          }
        }
      } catch (error) {
        console.error('i18n başlatma hatası:', error);
        
        if ((__DEV__ || process.env.NODE_ENV !== 'production') && addLog) {
          try {
            addLog(`i18n başlatma hatası: ${error.message}`, 'error');
          } catch (e) {
            console.warn('addLog error:', e);
          }
        }
        
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

