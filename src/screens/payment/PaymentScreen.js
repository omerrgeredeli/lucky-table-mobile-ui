import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  AppState,
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../context/PermissionContext';
import { AuthContext } from '../../context/AuthContext';
import { processQrCode } from '../../services/qrService';
import { colors, spacing, typography, shadows } from '../../theme';
import Logo from '../../components/Logo';

// Conditional import for expo-camera (web'de çalışmaz)
let CameraView, CameraType;
let cameraModuleLoaded = false;

if (Platform.OS !== 'web') {
  try {
    const Camera = require('expo-camera');
    if (Camera && Camera.CameraView) {
      CameraView = Camera.CameraView;
      CameraType = Camera.CameraType;
      cameraModuleLoaded = true;
    }
  } catch (error) {
    console.warn('expo-camera could not be loaded:', error);
  }
}

/**
 * Payment Screen - QR Code Okuma
 * Tam izin yönetimi, QR kod işleme ve backend entegrasyonu
 */
const PaymentScreen = () => {
  const { t } = useTranslation();
  const {
    cameraPermissionStatus,
    isCameraActive,
    requestCameraPermission,
    checkCameraPermission,
    setIsCameraActive,
    hasAnyPermissionDenied,
    openSettings,
  } = usePermissions();
  const { userToken } = React.useContext(AuthContext);

  // State
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);

  // Refs
  const scanLockRef = useRef(false);

  // AppState değişikliğini dinle (ayarlardan dönünce kontrol et)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // Uygulama aktif hale geldiğinde (ayarlardan dönünce)
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // İzinleri tekrar kontrol et
        setTimeout(async () => {
          await checkCameraPermission();
          // Eğer izin verildiyse kamera otomatik başlasın
          if (cameraPermissionStatus === 'granted') {
            setIsCameraActive(true);
          }
        }, 500);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription?.remove();
    };
  }, [appState, cameraPermissionStatus, checkCameraPermission, setIsCameraActive]);

  // Screen mount olduğunda izinleri kontrol et
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const checkPermissions = async () => {
      await checkCameraPermission();
      // İzin verildiyse kamera otomatik başlat
      if (cameraPermissionStatus === 'granted') {
        setIsCameraActive(true);
      }
    };

    checkPermissions();
  }, []);

  // İzin verildiğinde kamera otomatik başlat
  useEffect(() => {
    if (cameraPermissionStatus === 'granted' && !isCameraActive) {
      setIsCameraActive(true);
    }
  }, [cameraPermissionStatus, isCameraActive, setIsCameraActive]);

  // QR kod okunduğunda
  const handleBarCodeScanned = async ({ type, data }) => {
    // Lock mekanizması - tekrar okutmayı engelle
    if (scanLockRef.current || scanned || processing) {
      return;
    }

    scanLockRef.current = true;
    setScanned(true);
    setProcessing(true);

    try {
      console.log('QR Code scanned:', data);
      console.log('QR Code type:', type);

      // QR kod işleme servisi (mock/real ayrımı otomatik)
      // userToken'dan userId çıkarılabilir veya getUserProfile servisi kullanılabilir
      const result = await processQrCode(
        data,
        userToken || null, // userId - token'dan veya profile'dan alınabilir
        null // deviceId - gerekirse eklenebilir
      );

      if (result.success) {
        // Başarılı - sonucu göster
        setQrResult(result);
        setShowResultModal(true);
        // Kamera geçici olarak durdur
        setIsCameraActive(false);
      } else {
        // Hata durumu
        Alert.alert(
          t('payment.error'),
          result.error || t('payment.qrProcessingError'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                // 2 saniye sonra tekrar taramaya izin ver
                setTimeout(() => {
                  setScanned(false);
                  scanLockRef.current = false;
                  setProcessing(false);
                }, 2000);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('QR processing error:', error);
      Alert.alert(
        t('payment.error'),
        error.message || t('payment.qrProcessingError'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setTimeout(() => {
                setScanned(false);
                scanLockRef.current = false;
                setProcessing(false);
              }, 2000);
            },
          },
        ]
      );
    }
  };

  // Yeni QR okut
  const handleNewScan = () => {
    setQrResult(null);
    setShowResultModal(false);
    setScanned(false);
    scanLockRef.current = false;
    setProcessing(false);
    setIsCameraActive(true);
  };

  // İzin iste
  const handleRequestPermission = async () => {
    const result = await requestCameraPermission();
    if (result.granted) {
      setIsCameraActive(true);
    }
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
            <Text style={styles.title}>{t('payment.scanQR')}</Text>
            <Text style={styles.subtitle}>{t('payment.scanQRSubtitle')}</Text>
            <Text style={styles.infoText}>{t('payment.scanQRInfo')}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Kamera modülü yüklenmemişse
  if (!cameraModuleLoaded || !CameraView || !CameraType) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Logo size="small" />
          </View>
          <View style={styles.content}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.infoText}>{t('payment.cameraModuleLoading')}</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // İzin verilmemişse
  if (cameraPermissionStatus !== 'granted') {
    const showSettingsButton = cameraPermissionStatus === 'denied';

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Logo size="small" />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{t('payment.scanQR')}</Text>
            <Text style={styles.subtitle}>
              {cameraPermissionStatus === 'denied'
                ? t('payment.cameraPermissionDenied')
                : t('payment.cameraPermissionRequired')}
            </Text>

            {/* Ayarlara Git Butonu - denied durumunda veya herhangi bir izin eksikse */}
            {showSettingsButton && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={openSettings}
                activeOpacity={0.7}
              >
                <Text style={styles.settingsButtonText}>{t('payment.openSettings')}</Text>
              </TouchableOpacity>
            )}

            {cameraPermissionStatus === 'undetermined' && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={handleRequestPermission}
                activeOpacity={0.7}
              >
                <Text style={styles.settingsButtonText}>{t('payment.requestPermission')}</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.infoText}>
              {showSettingsButton ? t('payment.settingsInfo') : t('payment.permissionInfo')}
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Kamera aktif değilse (QR sonrası durdurulmuş olabilir)
  if (!isCameraActive) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Logo size="small" />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{t('payment.scanQR')}</Text>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleNewScan}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsButtonText}>{t('payment.newScan')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Kamera aktif - QR tarama ekranı
  return (
    <View style={styles.container}>
      <View style={styles.logoContainerAbsolute}>
        <Logo size="small" />
      </View>
      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.processingText}>{t('payment.processing')}</Text>
        </View>
      )}
      <CameraView
        style={styles.camera}
        facing={CameraType.back}
        onBarcodeScanned={scanned || processing ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanInstruction}>{t('payment.scanInstruction')}</Text>
          </View>
        </View>
      </CameraView>

      {/* QR Sonuç Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>{t('payment.paid')}</Text>
            </View>
            <View style={styles.resultBody}>
              {qrResult && (
                <>
                  <Text style={styles.resultMessage}>{qrResult.message}</Text>
                  <View style={styles.resultStats}>
                    <View style={styles.resultStatItem}>
                      <Text style={styles.resultStatLabel}>{t('payment.totalOrders')}</Text>
                      <Text style={styles.resultStatValue}>{qrResult.totalOrderCount}</Text>
                    </View>
                    <View style={styles.resultStatItem}>
                      <Text style={styles.resultStatLabel}>{t('payment.remainingForPromotion')}</Text>
                      <Text style={styles.resultStatValue}>{qrResult.remainingForPromotion}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>
            <View style={styles.resultFooter}>
              <TouchableOpacity
                style={styles.resultButton}
                onPress={handleNewScan}
                activeOpacity={0.7}
              >
                <Text style={styles.resultButtonText}>{t('payment.newScan')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  processingText: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    width: '90%',
    maxWidth: 400,
    ...shadows.large,
  },
  resultHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  resultBody: {
    padding: spacing.lg,
  },
  resultMessage: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  resultStats: {
    marginTop: spacing.md,
  },
  resultStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultStatLabel: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  resultStatValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  resultFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  resultButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default PaymentScreen;
