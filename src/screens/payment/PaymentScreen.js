import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  AppState,
} from 'react-native';
import { colors, spacing, typography, shadows } from '../../theme';
import Logo from '../../components/Logo';

// Conditional import for expo-camera (web'de çalışmaz)
let CameraView, CameraType, useCameraPermissions;
let cameraModuleLoaded = false;

if (Platform.OS !== 'web') {
  try {
    const Camera = require('expo-camera');
    if (Camera && Camera.CameraView) {
      CameraView = Camera.CameraView;
      CameraType = Camera.CameraType;
      useCameraPermissions = Camera.useCameraPermissions;
      cameraModuleLoaded = true;
      console.log('Camera module loaded successfully');
    } else {
      console.warn('expo-camera module structure is incorrect');
    }
  } catch (error) {
    console.warn('expo-camera could not be loaded:', error);
    cameraModuleLoaded = false;
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
    // Permission objesi varsa granted özelliğini kontrol et
    if (permission.granted === true) {
      return 'granted';
    }
    if (permission.canAskAgain === false) {
      return 'denied'; // Reddedilmiş ve ayarlara gitmek gerekiyor
    }
    return 'undetermined'; // Henüz sorulmamış, izin istenebilir
  };

  const permissionStatus = getPermissionStatus();
  const hasPermission = permissionStatus === 'granted';
  
  // Debug için permission durumunu logla
  useEffect(() => {
    if (Platform.OS !== 'web') {
      console.log('Camera permission status:', {
        permission,
        permissionStatus,
        hasPermission,
        cameraModuleLoaded,
        hasCameraView: !!CameraView,
      });
    }
  }, [permission, permissionStatus, hasPermission, cameraModuleLoaded]);

  // İlk yüklemede izin iste (undetermined durumunda)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Kısa bir gecikme ile izin iste (component mount olduktan sonra)
    const timer = setTimeout(() => {
      if (permissionStatus === 'undetermined' && requestPermission && cameraModuleLoaded) {
        // İlk kez izin iste
        requestPermission().catch((error) => {
          console.error('Permission request error:', error);
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [permissionStatus, requestPermission, cameraModuleLoaded]);

  // AppState değişikliğini dinle (ayarlardan dönünce kontrol et)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // Uygulama aktif hale geldiğinde (ayarlardan dönünce)
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // Permission'ı yeniden kontrol et - hook'u yeniden çağır
        // useCameraPermissions hook'u otomatik olarak güncellenecek
        // Kısa bir gecikme ile state'in güncellenmesini bekle
        setTimeout(async () => {
          console.log('App became active, checking camera permission...');
          // Permission'ı yeniden kontrol et
          if (requestPermission && cameraModuleLoaded) {
            try {
              const result = await requestPermission();
              console.log('Permission check result:', result);
            } catch (error) {
              console.error('Permission check error:', error);
            }
          }
        }, 500);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription?.remove();
    };
  }, [appState, requestPermission, cameraModuleLoaded]);

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
    
    // Backend entegrasyonu için hazır - QR kod verisi data değişkeninde
    // Burada backend API çağrısı yapılabilir:
    // Example: processQRCode(data).then(...)
    
    // Mock olarak sadece logluyoruz
    // Gerçek uygulamada burada backend'e istek gönderilecek:
    // await processPaymentQRCode(data);

    // 2 saniye sonra tekrar taramaya izin ver
    setTimeout(() => {
      setScanned(false);
    }, 2000);
  };

  // Web için placeholder
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Logo size="small" />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>QR Kod Okut</Text>
          <Text style={styles.subtitle}>
            QR kod tarama özelliği mobil cihazlarda kullanılabilir.
          </Text>
          <Text style={styles.infoText}>
            Android veya iOS cihazınızda uygulamayı açarak QR kod okutabilirsiniz.
          </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Kamera modülü yüklenmemişse kontrol et
  // Eğer permission granted ise ama modül yüklenmemişse, modül yüklenmeye çalışıyor olabilir
  if (Platform.OS !== 'web') {
    if (!cameraModuleLoaded || !CameraView) {
      // Permission granted ise, modül yükleniyor olabilir - kısa bir süre bekle
      if (hasPermission) {
        // Permission var ama modül henüz yüklenmemiş - kısa bir süre bekle
        return (
          <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.logoContainer}>
                <Logo size="small" />
              </View>
              <View style={styles.content}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.infoText}>Kamera hazırlanıyor...</Text>
              </View>
            </ScrollView>
          </View>
        );
      }
      // Permission yok ve modül yüklenmemiş - permission kontrolüne geç (aşağıdaki if bloğu)
    }
  }

  // Kamera izni verilmeden kamera render edilmemeli
  // Sadece denied durumunda ayarlara git butonu göster
  if (!hasPermission) {
    const showSettingsButton = permissionStatus === 'denied';
    
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Logo size="small" />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>QR Kod Okut</Text>
            <Text style={styles.subtitle}>
              {permissionStatus === 'denied' 
                ? 'Kamera izni reddedilmiş. Lütfen ayarlardan izin verin.'
                : 'QR kod okutmak için kamera iznine ihtiyacımız var'}
            </Text>

          {/* Ayarlara Git Butonu - Sadece denied durumunda görünür */}
          {showSettingsButton && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleOpenSettings}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>Ayarlara Git</Text>
            </TouchableOpacity>
          )}

          {permissionStatus === 'undetermined' && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={async () => {
                if (requestPermission && cameraModuleLoaded) {
                  try {
                    const result = await requestPermission();
                    console.log('Permission request result:', result);
                  } catch (error) {
                    console.error('Permission request error:', error);
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>İzin İste</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.infoText}>
            {showSettingsButton 
              ? 'Ayarlardan kamera iznini açtıktan sonra uygulamaya geri dönün.'
              : 'Kamera izni verildikten sonra QR kod okutabilirsiniz.'}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Kamera izni verilmişse - kamera otomatik açılır
  // CameraView ve CameraType kontrolü
  if (!CameraView || !CameraType) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Logo size="small" />
          </View>
          <View style={styles.content}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.infoText}>Kamera modülü yükleniyor...</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainerAbsolute}>
        <Logo size="small" />
      </View>
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
  scrollContent: {
    padding: spacing.md,
  },
  logoContainer: {
    paddingBottom: spacing.sm,
  },
  logoContainerAbsolute: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    zIndex: 10,
    alignItems: 'center',
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
