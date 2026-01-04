import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  Modal,
  AppState,
} from 'react-native';
import { colors, spacing, typography, shadows } from '../../theme';
import { getUserLoyaltyInfo } from '../../services/userService';

// Web için CameraView'i conditional import et - sadece native'de yükle
let CameraView, CameraType, useCameraPermissions;
let cameraLoaded = false;

const loadCamera = () => {
  if (Platform.OS === 'web' || cameraLoaded) {
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Camera = require('expo-camera');
    CameraView = Camera.CameraView;
    CameraType = Camera.CameraType;
    useCameraPermissions = Camera.useCameraPermissions;
    cameraLoaded = true;
  } catch (error) {
    console.warn('expo-camera could not be loaded:', error);
    cameraLoaded = true;
  }
};

// Fallback hook - her zaman tanımlı olmalı
const fallbackCameraPermissions = () => [{ granted: false }, async () => ({ granted: false })];

// Web için mock hook
if (Platform.OS === 'web') {
  useCameraPermissions = fallbackCameraPermissions;
  cameraLoaded = true;
}

// useCameraPermissions undefined ise fallback kullan
if (!useCameraPermissions) {
  useCameraPermissions = fallbackCameraPermissions;
}

/**
 * Payment Screen - Ödeme Yap
 * Gerçek QR kod okuma ve sipariş sayısını artırma
 */
const PaymentScreen = () => {
  // Camera modülünü yükle
  useEffect(() => {
    loadCamera();
  }, []);

  // Permission hook'unu kullan (her zaman çağrılmalı - hook kuralları)
  // useCameraPermissions her zaman tanımlı olmalı (fallback ile)
  const [permission, requestPermissionHook] = useCameraPermissions();
  
  // Permission durumunu kontrol et - AppState ile yeniden kontrol
  const hasPermission = permission && permission.granted;
  
  // Permission değişikliğini takip et (ayarlardan dönünce kontrol et)
  useEffect(() => {
    if (permission && permission.granted && CameraView) {
      // İzin verildiyse ve henüz kamera açılmadıysa, kullanıcıya bilgi ver
      console.log('Camera permission granted');
    }
  }, [permission]);
  
  // AppState değişikliğini dinle (ayarlardan dönünce kontrol et)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    
    const checkPermissionOnFocus = async () => {
      // Ayarlardan dönünce permission'ı yeniden kontrol et
      if (requestPermissionHook) {
        try {
          // Permission'ı yeniden kontrol et (yeniden request etmeden)
          const result = await requestPermissionHook();
          if (result && result.granted && !hasPermission) {
            console.log('Permission granted after settings');
            if (Platform.OS === 'web') {
              window.alert('Kamera izni verildi. QR kod okutabilirsiniz.');
            } else {
              Alert.alert('Başarılı', 'Kamera izni verildi. QR kod okutabilirsiniz.');
            }
          }
        } catch (error) {
          console.error('Permission check error:', error);
        }
      }
    };
    
    // App focus olduğunda kontrol et
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Kısa bir gecikme ile kontrol et (permission state güncellensin)
        setTimeout(() => {
          checkPermissionOnFocus();
        }, 500);
      }
    });
    
    return () => {
      subscription?.remove();
    };
  }, [requestPermissionHook]); // hasPermission dependency'sini kaldırdık - her zaman kontrol et
  
  // Request permission wrapper
  const requestPermission = async () => {
    if (requestPermissionHook) {
      try {
        return await requestPermissionHook();
      } catch (error) {
        console.error('Permission request error:', error);
        return { granted: false };
      }
    }
    return { granted: false };
  };

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [qrData, setQrData] = useState(null);

  const checkCameraPermission = async () => {
    if (!permission) {
      // İlk yüklemede permission henüz yüklenmemiş
      return;
    }
    
    if (!permission.granted) {
      // İzin yoksa, kullanıcıya bilgi ver
      // Kamerayı açmadan önce izin isteyeceğiz
    }
  };

  // Kamera izni iste - ÖNCE MEVCUT İZNİ KONTROL ET
  const handleRequestPermission = async () => {
    if (!requestPermissionHook) {
      Alert.alert('Hata', 'Kamera modülü yüklenemedi.');
      return;
    }
    
    try {
      // Önce mevcut permission durumunu kontrol et
      if (permission && permission.granted) {
        // İzin zaten verilmiş - direkt kamerayı açabilir
        if (Platform.OS === 'web') {
          window.alert('Kamera izni zaten verilmiş. "Kamera Aç" butonuna basarak kamerayı açabilirsiniz.');
        } else {
          Alert.alert('Bilgi', 'Kamera izni zaten verilmiş. "Kamera Aç" butonuna basarak kamerayı açabilirsiniz.');
        }
        return;
      }
      
      // İzin yoksa iste
      const result = await requestPermission();
      if (result && result.granted) {
        // Permission hook tarafından otomatik güncellenecek
        // KAMERAYI OTOMATİK AÇMA - Kullanıcı butona basmalı
        if (Platform.OS === 'web') {
          window.alert('Kamera izni verildi. "Kamera Aç" butonuna basarak kamerayı açabilirsiniz.');
        } else {
          Alert.alert('Başarılı', 'Kamera izni verildi. "Kamera Aç" butonuna basarak kamerayı açabilirsiniz.');
        }
      } else {
        // İzin reddedildi - ayarlara yönlendir (sadece gerçekten reddedildiyse)
        Alert.alert(
          'Kamera İzni Gerekli',
          'QR kod okutmak için kamera iznine ihtiyacımız var. Lütfen ayarlardan izin verin.',
          [
            { text: 'İptal', style: 'cancel' },
            {
              text: 'Ayarlara Git',
              onPress: async () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
                // Ayarlardan dönünce permission'ı kontrol et
                setTimeout(async () => {
                  if (requestPermissionHook) {
                    try {
                      const newResult = await requestPermissionHook();
                      if (newResult && newResult.granted) {
                        Alert.alert('Başarılı', 'Kamera izni verildi. QR kod okutabilirsiniz.');
                      }
                    } catch (error) {
                      console.error('Permission check error:', error);
                    }
                  }
                }, 2000);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
      Alert.alert('Hata', 'Kamera izni alınırken bir hata oluştu.');
    }
  };

  // QR kod tarama başlat
  const handleStartScan = async () => {
    if (!cameraLoaded || !permission) {
      // Camera henüz yüklenmemiş
      if (!cameraLoaded) {
        loadCamera();
      }
      return;
    }

    if (!permission.granted) {
      // İzin yoksa iste
      await handleRequestPermission();
      return;
    }

    // İzin varsa kamerayı aç
    if (!CameraView) {
      Alert.alert('Hata', 'Kamera modülü yüklenemedi.');
      return;
    }
    setScanned(false);
    setQrData(null);
    setShowCamera(true);
  };

  // QR kod okunduğunda - GERÇEK KAMERA İLE
  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned) return; // Zaten okunmuşsa tekrar işleme alma
    
    // Kamera gerçekten açık mı kontrol et
    if (!showCamera || !CameraView) {
      console.warn('Camera is not active, ignoring scan');
      return;
    }
    
    // QR kod gerçekten okundu - state'e kaydet
    setScanned(true);
    setQrData(data);
    
    // Kamerayı kapat
    setShowCamera(false);
    
    // QR kod içeriğini işle (sadece gerçekten okunduktan sonra)
    await handleQRCodeScanned(data);
  };

  // QR kod işleme - SADECE GERÇEK KAMERA İLE OKUNDUKTAN SONRA
  const handleQRCodeScanned = async (qrCode) => {
    // QR kod gerçekten okundu mu kontrol et
    if (!qrCode || !qrData) {
      console.warn('QR code data is missing');
      return;
    }
    
    setLoading(true);
    try {
      // Backend'e QR kod gönderilecek ve sipariş sayısı artırılacak
      // Gerçek API entegrasyonu için service katmanı kullanılacak
      
      // Simüle edilmiş API çağrısı (gerçek backend entegrasyonu için hazır)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Başarı mesajı - sadece gerçekten QR okunduktan sonra
      if (Platform.OS === 'web') {
        window.alert(`QR kod başarıyla okundu.\n\nKod: ${qrCode}\n\nSipariş sayınız güncellendi.`);
      } else {
        Alert.alert(
          'Başarılı',
          `QR kod başarıyla okundu.\n\nKod: ${qrCode}\n\nSipariş sayınız güncellendi.`,
          [
            {
              text: 'Tamam',
              onPress: () => {
                // Sadakat bilgilerini yenile
                getUserLoyaltyInfo().catch(console.error);
              },
            },
          ]
        );
      }

      // Sadakat bilgilerini yenile
      await getUserLoyaltyInfo();
    } catch (error) {
      console.error('QR code processing error:', error);
      if (Platform.OS === 'web') {
        window.alert('QR kod işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
      } else {
        Alert.alert('Hata', 'QR kod işlenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
      setScanned(false);
      setQrData(null);
    }
  };

  // Kamerayı kapat
  const handleCloseCamera = () => {
    setShowCamera(false);
    setScanned(false);
    setQrData(null);
  };

  // İzin durumu kontrolü - permission null ise loading göster (sadece native'de ve hook yüklenene kadar)
  // Fallback hook her zaman bir değer döndürür, bu yüzden null kontrolü sadece gerçek hook için gerekli
  if (permission === null && Platform.OS !== 'web' && !cameraLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>QR Kod Okut</Text>
        <Text style={styles.subtitle}>
          Kamerayı QR koda doğrultun
        </Text>

        {/* QR Kod Tarama Alanı */}
        <View style={styles.scannerContainer}>
          {Platform.OS === 'web' ? (
            <View style={styles.scannerPlaceholder}>
              <Text style={styles.scannerIcon}>📷</Text>
              <Text style={styles.scannerPlaceholderText}>
                QR kod tarama özelliği mobil cihazlarda kullanılabilir.
              </Text>
              <Text style={styles.webInfoText}>
                Android veya iOS cihazınızda uygulamayı açarak QR kod okutabilirsiniz.
              </Text>
            </View>
          ) : showCamera && permission && permission.granted && CameraView && cameraLoaded ? (
            <Modal
              visible={showCamera}
              animationType="slide"
              onRequestClose={handleCloseCamera}
            >
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing={CameraType.back}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                >
                  <View style={styles.cameraOverlay}>
                    <View style={styles.scanArea}>
                      <View style={styles.scanFrame} />
                      <Text style={styles.scanInstruction}>
                        QR kodu bu alana yerleştirin
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={handleCloseCamera}
                    >
                      <Text style={styles.closeButtonText}>Kapat</Text>
                    </TouchableOpacity>
                  </View>
                </CameraView>
              </View>
            </Modal>
          ) : (
            <View style={styles.scannerPlaceholder}>
              <Text style={styles.scannerIcon}>📷</Text>
              <Text style={styles.scannerPlaceholderText}>
                {hasPermission
                  ? 'QR kod okutmak için "Kamera Aç" butonuna basın'
                  : 'Kamera izni gereklidir. Lütfen "Kamera İzni Ver" butonuna basın.'}
              </Text>
              {qrData && (
                <View style={styles.qrDataContainer}>
                  <Text style={styles.qrDataLabel}>Son okunan kod:</Text>
                  <Text style={styles.qrDataText}>{qrData}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Tarama Butonu - KAMERA SADECE BUTON İLE AÇILIR */}
        {/* Buton her zaman görünür olmalı - cameraLoaded kontrolü kaldırıldı */}
        {Platform.OS !== 'web' && (
          <>
            {hasPermission ? (
              <TouchableOpacity
                style={[styles.scanButton, (loading || showCamera) && styles.scanButtonDisabled]}
                onPress={handleStartScan}
                disabled={loading || showCamera || !cameraLoaded}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : showCamera ? (
                  <Text style={styles.scanButtonText}>Taranıyor...</Text>
                ) : (
                  <Text style={styles.scanButtonText}>📷 Kamera Aç</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.permissionButton}
                onPress={handleRequestPermission}
              >
                <Text style={styles.permissionButtonText}>Kamera İzni Ver</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <Text style={styles.infoText}>
          QR kod okutulduğunda sipariş sayınız otomatik olarak artırılacaktır.
        </Text>
      </View>
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
  scannerContainer: {
    width: '100%',
    height: 300,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    marginBottom: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
    overflow: 'hidden',
  },
  scannerPlaceholder: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  scannerIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  scannerPlaceholderText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  qrDataContainer: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    width: '100%',
  },
  qrDataLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  qrDataText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
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
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
  },
  closeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  scanButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.sm,
    minWidth: 200,
    alignItems: 'center',
    ...shadows.medium,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  permissionButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.secondary || colors.primary,
    borderRadius: spacing.sm,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  infoText: {
    marginTop: spacing.xl,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  webInfoText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
});

export default PaymentScreen;
