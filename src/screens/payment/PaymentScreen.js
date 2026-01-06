import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  AppState,
} from 'react-native';
import { colors, spacing, typography, shadows } from '../../theme';

// Conditional import for expo-camera (web'de çalışmaz)
let CameraView, CameraType, useCameraPermissions;
let cameraModuleLoaded = false;

if (Platform.OS !== 'web') {
  try {
    const Camera = require('expo-camera');
    CameraView = Camera.CameraView;
    CameraType = Camera.CameraType;
    useCameraPermissions = Camera.useCameraPermissions;
    cameraModuleLoaded = true;
  } catch (error) {
    console.warn('expo-camera could not be loaded:', error);
  }
}

// Fallback hook for web or when camera module is not available
const fallbackCameraPermissions = () => {
  return [
    { granted: false, canAskAgain: false },
    async () => ({ granted: false, canAskAgain: false }),
  ];
};

if (!useCameraPermissions) {
  useCameraPermissions = fallbackCameraPermissions;
}

/**
 * Payment Screen - QR Code Okuma
 * Kamera izni yönetimi ve QR kod tarama
 */
const PaymentScreen = () => {
  // Kamera izni state - granted / denied / undetermined
  const [permission, requestPermission] = useCameraPermissions();
  const [appState, setAppState] = useState(AppState.currentState);
  const [scanned, setScanned] = useState(false);

  // Kamera izni durumunu belirle
  const getPermissionStatus = () => {
    if (!permission) {
      return 'undetermined'; // Henüz kontrol edilmemiş
    }
    if (permission.granted) {
      return 'granted';
    }
    if (permission.canAskAgain === false) {
      return 'denied'; // Reddedilmiş ve ayarlara gitmek gerekiyor
    }
    return 'undetermined'; // Henüz sorulmamış, izin istenebilir
  };

  const permissionStatus = getPermissionStatus();
  const hasPermission = permissionStatus === 'granted';

  // İlk yüklemede izin iste (undetermined durumunda)
  useEffect(() => {
    if (Platform.OS === 'web' || !cameraModuleLoaded) return;

    if (permissionStatus === 'undetermined' && requestPermission) {
      // İlk kez izin iste
      requestPermission().catch((error) => {
        console.error('Permission request error:', error);
      });
    }
  }, [permissionStatus, requestPermission]);

  // AppState değişikliğini dinle (ayarlardan dönünce kontrol et)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // Uygulama aktif hale geldiğinde (ayarlardan dönünce)
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // Permission'ı yeniden kontrol et
        // useCameraPermissions hook'u otomatik olarak güncellenecek
        // Sadece kısa bir gecikme ile state'in güncellenmesini bekle
        setTimeout(() => {
          // Permission state otomatik güncellenecek
          console.log('App became active, checking camera permission...');
        }, 300);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription?.remove();
    };
  }, [appState]);

  // Ayarlara git
  const handleOpenSettings = async () => {
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

  // QR kod okunduğunda
  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return; // Zaten okunmuşsa tekrar işleme alma

    setScanned(true);
    
    // QR kod içeriğini console.log ile yazdır
    console.log('QR Code scanned:', data);
    console.log('QR Code type:', type);

    // 2 saniye sonra tekrar taramaya izin ver
    setTimeout(() => {
      setScanned(false);
    }, 2000);
  };

  // Web için placeholder
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>QR Kod Okut</Text>
          <Text style={styles.subtitle}>
            QR kod tarama özelliği mobil cihazlarda kullanılabilir.
          </Text>
          <Text style={styles.infoText}>
            Android veya iOS cihazınızda uygulamayı açarak QR kod okutabilirsiniz.
          </Text>
        </View>
      </View>
    );
  }

  // Kamera modülü yüklenmemişse
  if (!cameraModuleLoaded || !CameraView) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.infoText}>Kamera modülü yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Kamera izni verilmeden kamera render edilmemeli
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>QR Kod Okut</Text>
          <Text style={styles.subtitle}>
            QR kod okutmak için kamera iznine ihtiyacımız var
          </Text>

          {/* Ayarlara Git Butonu - Sadece izin verilmemişse görünür */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleOpenSettings}
            activeOpacity={0.7}
          >
            <Text style={styles.settingsButtonText}>Ayarlara Git</Text>
          </TouchableOpacity>

          <Text style={styles.infoText}>
            Ayarlardan kamera iznini açtıktan sonra uygulamaya geri dönün.
          </Text>
        </View>
      </View>
    );
  }

  // Kamera izni verilmişse - kamera otomatik açılır
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={CameraType.back}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanInstruction}>
              QR kodu bu alana yerleştirin
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  settingsButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.sm,
    minWidth: 200,
    alignItems: 'center',
    ...shadows.medium,
    marginBottom: spacing.md,
  },
  settingsButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  infoText: {
    marginTop: spacing.lg,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: spacing.sm,
    backgroundColor: 'transparent',
  },
  scanInstruction: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: spacing.sm,
    borderRadius: spacing.sm,
  },
});

export default PaymentScreen;
