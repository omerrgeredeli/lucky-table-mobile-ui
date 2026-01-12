import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform, AppState, Linking } from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditional import for expo-camera - Lazy loading (web'de hiç yüklenmez)
// NOT: require() çağrısı fonksiyon içinde olmalı, dosya seviyesinde DEĞİL
const loadCameraPermissions = () => {
  if (Platform.OS === 'web') {
    return () => [
      { granted: false, canAskAgain: false },
      async () => ({ granted: false, canAskAgain: false }),
    ];
  }
  try {
    // require() sadece native platformlarda çalışır
    const Camera = require('expo-camera');
    return Camera.useCameraPermissions;
  } catch (error) {
    console.warn('expo-camera could not be loaded:', error);
    return () => [
      { granted: false, canAskAgain: false },
      async () => ({ granted: false, canAskAgain: false }),
    ];
  }
};

const PermissionContext = createContext();

export const PermissionProvider = ({ children }) => {
  // Camera permission hook - lazy load
  const cameraPermissionHook = loadCameraPermissions()();
  const [cameraPermission, requestCameraPermission] = cameraPermissionHook || [
    { granted: false, canAskAgain: false },
    async () => ({ granted: false, canAskAgain: false }),
  ];
  
  // Camera permission state
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState('undetermined'); // 'undetermined' | 'granted' | 'denied'
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Location permission state
  const [locationPermissionStatus, setLocationPermissionStatus] = useState('undetermined'); // 'undetermined' | 'granted' | 'denied'

  // AppState tracking
  const [appState, setAppState] = useState(AppState.currentState);

  // Storage keys
  const CAMERA_PERMISSION_KEY = 'app_camera_permission_asked';
  const LOCATION_PERMISSION_KEY = 'app_location_permission_asked';

  /**
   * Camera permission durumunu kontrol et ve güncelle
   */
  const checkCameraPermission = async () => {
    if (Platform.OS === 'web') {
      setCameraPermissionStatus('denied');
      return;
    }

    try {
      if (!cameraPermission) {
        setCameraPermissionStatus('undetermined');
        return;
      }

      if (cameraPermission.granted === true) {
        setCameraPermissionStatus('granted');
        await AsyncStorage.setItem(CAMERA_PERMISSION_KEY, 'true');
      } else if (cameraPermission.canAskAgain === false) {
        setCameraPermissionStatus('denied');
      } else {
        setCameraPermissionStatus('undetermined');
      }
    } catch (error) {
      console.error('Camera permission check error:', error);
      setCameraPermissionStatus('undetermined');
    }
  };

  /**
   * Location permission durumunu kontrol et ve güncelle
   */
  const checkLocationPermission = async () => {
    if (Platform.OS === 'web') {
      setLocationPermissionStatus('denied');
      return;
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermissionStatus('granted');
        await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
      } else if (status === 'denied') {
        setLocationPermissionStatus('denied');
      } else {
        setLocationPermissionStatus('undetermined');
      }
    } catch (error) {
      console.error('Location permission check error:', error);
      setLocationPermissionStatus('undetermined');
    }
  };

  /**
   * Camera permission iste
   */
  const requestCameraPermissionAsync = async () => {
    if (Platform.OS === 'web') {
      return { granted: false };
    }

    try {
      if (!requestCameraPermission) {
        return { granted: false };
      }

      const result = await requestCameraPermission();
      await checkCameraPermission();
      return result;
    } catch (error) {
      console.error('Camera permission request error:', error);
      return { granted: false };
    }
  };

  /**
   * Location permission iste
   */
  const requestLocationPermissionAsync = async () => {
    if (Platform.OS === 'web') {
      return { granted: false };
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermissionStatus('granted');
        await AsyncStorage.setItem(LOCATION_PERMISSION_KEY, 'true');
        return { granted: true };
      } else {
        setLocationPermissionStatus('denied');
        return { granted: false };
      }
    } catch (error) {
      console.error('Location permission request error:', error);
      setLocationPermissionStatus('undetermined');
      return { granted: false };
    }
  };

  /**
   * İlk açılışta izinleri kontrol et ve iste
   */
  const initializePermissions = async () => {
    if (Platform.OS === 'web') return;

    try {
      // Önce mevcut durumları kontrol et
      await checkCameraPermission();
      await checkLocationPermission();

      // Storage'dan daha önce izin istenip istenmediğini kontrol et
      const cameraAsked = await AsyncStorage.getItem(CAMERA_PERMISSION_KEY);
      const locationAsked = await AsyncStorage.getItem(LOCATION_PERMISSION_KEY);

      // İlk açılışta (storage'da yoksa) tüm izinleri otomatik iste
      if (!cameraAsked) {
        // Kısa bir gecikme ile izin iste (UI hazır olsun)
        setTimeout(async () => {
          await requestCameraPermissionAsync();
        }, 500);
      }

      if (!locationAsked) {
        // Kısa bir gecikme ile izin iste
        setTimeout(async () => {
          await requestLocationPermissionAsync();
        }, 1000);
      }
    } catch (error) {
      console.error('Permission initialization error:', error);
    }
  };

  /**
   * Ayarlara git
   */
  const openSettings = async () => {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  };

  // Camera permission değişikliğini dinle
  useEffect(() => {
    if (Platform.OS !== 'web') {
      checkCameraPermission();
    }
  }, [cameraPermission]);

  // İlk mount'ta izinleri kontrol et ve iste
  useEffect(() => {
    if (Platform.OS !== 'web') {
      initializePermissions();
    }
  }, []);

  // AppState değişikliğini dinle (ayarlardan dönünce kontrol et)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // Uygulama aktif hale geldiğinde (ayarlardan dönünce)
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // Kısa bir gecikme ile izinleri tekrar kontrol et
        setTimeout(async () => {
          await checkCameraPermission();
          await checkLocationPermission();
        }, 500);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription?.remove();
    };
  }, [appState]);

  const value = {
    // Camera
    cameraPermissionStatus,
    isCameraActive,
    requestCameraPermission: requestCameraPermissionAsync,
    checkCameraPermission,
    setIsCameraActive,
    
    // Location
    locationPermissionStatus,
    requestLocationPermission: requestLocationPermissionAsync,
    checkLocationPermission,
    
    // Settings
    openSettings,
    
    // Helpers
    hasAllPermissions: cameraPermissionStatus === 'granted' && locationPermissionStatus === 'granted',
    hasAnyPermissionDenied: cameraPermissionStatus === 'denied' || locationPermissionStatus === 'denied',
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};
