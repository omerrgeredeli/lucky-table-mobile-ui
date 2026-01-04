import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

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
       message.includes('Animated: `useNativeDriver` is not supported'))
    ) {
      // Bu uyarıları görmezden gel
      return;
    }
    originalWarn.apply(console, args);
  };
}

/**
 * Ana Uygulama Entry Point
 * AuthProvider ile tüm uygulamayı sarmalıyoruz
 */
export default function App() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </AuthProvider>
  );
}

