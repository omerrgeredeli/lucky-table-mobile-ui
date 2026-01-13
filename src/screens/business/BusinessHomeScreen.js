import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { getUserProfile } from '../../services/userService';
import { generateBusinessQRCode } from '../../services/businessQRService';
import { scanPromotionQRCode } from '../../services/businessQRService';
import { colors, spacing, typography, shadows } from '../../theme';
import { foodCategories } from '../../data/foodCategories';
import { USE_MOCK_API } from '../../config/api';
import Logo from '../../components/Logo';
import Button from '../../components/Button';

// QR Code Generator - Bitmap/Canvas tabanlı (SVG YOK)
// qrcode paketi kullanılacak (Node.js tabanlı, React Native'de çalışır)
let QRCode;
if (Platform.OS !== 'web') {
  try {
    QRCode = require('qrcode');
  } catch (error) {
    console.warn('QR Code library not available:', error);
  }
}

/**
 * QR Code bitmap image üretir (SVG YOK)
 * @param {string} value - QR kod içeriği
 * @param {number} size - QR kod boyutu
 * @returns {Promise<string|null>} Base64 image data URI veya null
 */
const generateQRCodeImage = async (value, size = 260) => {
  if (Platform.OS === 'web' || !QRCode) {
    return null;
  }

  try {
    // qrcode paketi ile bitmap QR code üret (PNG base64)
    const qrCodeData = await QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Base64 data URI formatında döner
    if (qrCodeData && typeof qrCodeData === 'string') {
      return qrCodeData;
    }

    return null;
  } catch (error) {
    console.error('QR Code generation error:', error);
    return null;
  }
};

// Camera import - Lazy loading (web'de hiç yüklenmez)
// NOT: require() çağrısı fonksiyon içinde olmalı, dosya seviyesinde DEĞİL
const loadCamera = () => {
  if (Platform.OS === 'web') {
    return { CameraView: null, useCameraPermissions: null };
  }
  try {
    // require() sadece native platformlarda çalışır
    const Camera = require('expo-camera');
    return {
      CameraView: Camera.CameraView,
      useCameraPermissions: Camera.useCameraPermissions,
    };
  } catch (error) {
    console.warn('expo-camera could not be loaded:', error);
    return { CameraView: null, useCameraPermissions: null };
  }
};

/**
 * Business Home Screen
 * İşletme kullanıcıları için ana ekran
 * - QR Kod Üretme (sipariş tipi seçimi ile)
 * - Promosyon Alma (QR kod okuma)
 */
const BusinessHomeScreen = () => {
  const { t } = useTranslation();
  const { userToken } = React.useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // QR Kod Üretme State
  const [selectedOrderTypes, setSelectedOrderTypes] = useState([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null); // Bitmap image (base64)
  const [qrCodeLoading, setQrCodeLoading] = useState(false);
  
  // Promosyon Alma State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [scanProcessing, setScanProcessing] = useState(false);
  
  // Sipariş tipleri - foodCategories'den alt kategorileri al (BOTH kategorisinden)
  // Bu alt kategoriler filtre ekranındaki ile aynı
  const orderTypes = foodCategories?.BOTH?.subCategories || [];
  
  // Expo Camera permissions hook (SDK 51) - PaymentScreen ile aynı mantık
  const cameraModule = loadCamera();
  const actualUseCameraPermissions = cameraModule.useCameraPermissions;
  
  // Web modunda fallback değerler kullan
  let permission, requestPermission;
  if (Platform.OS === 'web' || !actualUseCameraPermissions) {
    // Web modunda kamera izni yok
    permission = { granted: false, canAskAgain: false };
    requestPermission = async () => ({ granted: false });
  } else {
    // Native modlarda hook'u kullan
    [permission, requestPermission] = actualUseCameraPermissions();
  }
  
  useEffect(() => {
    fetchUserProfile();
  }, []);
  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Profil bilgisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // İzin iste - PaymentScreen ile aynı
  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (!result.granted) {
      Alert.alert(
        t('business.cameraPermissionRequired'),
        t('payment.permissionInfo') || t('business.cameraPermissionRequired')
      );
    }
  };
  
  // Ayarlara git - PaymentScreen ile aynı
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
  
  // Sipariş tipi toggle
  const toggleOrderType = (orderType) => {
    setSelectedOrderTypes((prev) => {
      const typeId = typeof orderType === 'string' ? orderType : orderType.id;
      const existingIndex = prev.findIndex(ot => {
        const otId = typeof ot === 'string' ? ot : ot.id;
        return otId === typeId;
      });
      
      if (existingIndex >= 0) {
        return prev.filter((_, index) => index !== existingIndex);
      } else {
        return [...prev, orderType];
      }
    });
  };
  
  // QR Kod Üret - PAYLOAD VALIDATION ile güvenli
  const handleGenerateQR = async () => {
    if (selectedOrderTypes.length === 0) {
      Alert.alert(
        t('business.selectOrderType'),
        t('business.selectOrderTypeMessage')
      );
      return;
    }
    
    // PAYLOAD VALIDATION - Modal açılmadan önce kontrol et
    if (!userProfile || !userProfile.id) {
      Alert.alert(
        t('business.error'),
        t('business.userInfoError') || 'Kullanıcı bilgisi alınamadı'
      );
      return;
    }

    // İşletme adı: Mock'ta userProfile'dan, gerçekte backend/token'dan
    const businessName = USE_MOCK_API 
      ? (userProfile?.fullName || userProfile?.name || 'Test Business')
      : (userProfile?.fullName || userProfile?.name || userProfile?.businessName || t('business.businessName'));

    if (!businessName || typeof businessName !== 'string' || businessName.trim() === '') {
      Alert.alert(
        t('business.error'),
        t('business.businessNameError') || 'İşletme adı bulunamadı'
      );
      return;
    }
    
    setQrCodeLoading(true);
    try {
      const qrData = await generateBusinessQRCode({
        orderTypes: selectedOrderTypes.map(ot => typeof ot === 'string' ? ot : ot.id || ot.name),
        businessName,
        userId: userProfile.id,
      });
      
      // QR data validation - string olmalı
      if (!qrData || typeof qrData !== 'string') {
        throw new Error('QR kod verisi geçersiz format');
      }

      setQrCodeData(qrData);
      setShowQRModal(true);
    } catch (error) {
      console.error('QR kod üretme hatası:', error);
      Alert.alert(
        t('business.error'),
        error.message || t('business.qrGenerationError')
      );
    } finally {
      setQrCodeLoading(false);
    }
  };
  
  // Promosyon Alma - Kamera Aç
  const handleOpenPromotionScanner = () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        t('business.webNotSupported'),
        t('business.webCameraMessage')
      );
      return;
    }
    setShowCameraModal(true);
    setScanned(false);
    setScanProcessing(false);
  };
  
  // QR Kod Okundu
  const handleQRScanned = async ({ type, data }) => {
    if (scanned || scanProcessing) {
      return;
    }
    
    setScanned(true);
    setScanProcessing(true);
    
    try {
      const result = await scanPromotionQRCode(data, userToken);
      
      if (result.success) {
        Alert.alert(
          t('business.success'),
          t('business.promotionScanned'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                setShowCameraModal(false);
                setScanned(false);
                setScanProcessing(false);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          t('business.error'),
          result.error || t('business.scanError'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                setTimeout(() => {
                  setScanned(false);
                  setScanProcessing(false);
                }, 2000);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('QR scan error:', error);
      Alert.alert(
        t('business.error'),
        error.message || t('business.scanError'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setTimeout(() => {
                setScanned(false);
                setScanProcessing(false);
              }, 2000);
            },
          },
        ]
      );
    }
  };
  
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Logo size="small" />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {t('common.loading')}
          </Text>
        </View>
      </View>
    );
  }
  
  // İşletme adı: Mock'ta userProfile'dan, gerçekte backend/token'dan
  const businessName = USE_MOCK_API 
    ? (userProfile?.fullName || userProfile?.name || 'Test Business')
    : (userProfile?.fullName || userProfile?.name || userProfile?.businessName || t('business.businessName'));
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo size="small" />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* İşletme Adı */}
        <Text style={styles.businessName}>{businessName}</Text>
        
        {/* ÜST ALAN - QR KOD ÜRETME */}
        <View style={styles.section}>
          {/* Sipariş Tipi Tag'leri - NULL/UNDEFINED kontrolü */}
          <View style={styles.tagContainer}>
            {orderTypes && orderTypes.length > 0 ? (
              orderTypes.map((orderType) => {
                // Güvenli kontrol
                if (!orderType) {
                  return null;
                }
                const typeId = typeof orderType === 'string' ? orderType : (orderType?.id || null);
                const typeName = typeof orderType === 'string' ? orderType : (orderType?.name || '');
                
                if (!typeId) {
                  return null; // Geçersiz orderType
                }
                
                const isSelected = selectedOrderTypes.some(ot => {
                  if (!ot) return false;
                  const otId = typeof ot === 'string' ? ot : (ot?.id || null);
                  return otId === typeId;
                });
                
                return (
                  <TouchableOpacity
                    key={typeId}
                    style={[
                      styles.tagButton,
                      isSelected && styles.tagButtonActive,
                    ]}
                    onPress={() => toggleOrderType(orderType)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.tagButtonText,
                        isSelected && styles.tagButtonTextActive,
                      ]}
                    >
                      {t(`filter.orderTypes.${typeName}`, { defaultValue: typeName || typeId })}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.noOrderTypesText}>
                {t('business.noOrderTypes') || 'Sipariş tipi bulunamadı'}
              </Text>
            )}
          </View>
          
          {/* QR Kod Üret Butonu */}
          <Button
            title={t('business.generateQRCode')}
            onPress={handleGenerateQR}
            loading={qrCodeLoading}
            style={styles.generateButton}
          />
        </View>
        
        {/* ALT ALAN - QR KOD TARA */}
        <View style={styles.section}>
          <Button
            title={t('business.scanQRCode')}
            onPress={handleOpenPromotionScanner}
            style={styles.scanButton}
          />
        </View>
      </ScrollView>
      
      {/* QR Kod Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('business.qrCode')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowQRModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {qrCodeData ? (
                <View style={styles.qrCodeContainer}>
                  {Platform.OS === 'web' ? (
                    <View style={styles.qrCodePlaceholder}>
                      <Text style={styles.qrCodeText}>QR Code (Web)</Text>
                      <Text style={styles.qrCodeDataText} selectable>
                        {qrCodeData.substring(0, 100)}...
                      </Text>
                    </View>
                  ) : qrCodeImage ? (
                    // Bitmap QR Code - SVG YOK, LinearGradient YOK
                    <Image
                      source={{ uri: qrCodeImage }}
                      style={styles.qrCodeImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.qrCodePlaceholder}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.qrCodeText}>QR kod oluşturuluyor...</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.qrCodeContainer}>
                  <Text style={styles.qrCodeText}>
                    {t('business.qrCodeGenerating')}
                  </Text>
                </View>
              )}
              
              <Button
                title={t('common.close')}
                onPress={() => setShowQRModal(false)}
                style={styles.closeModalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Kamera Modal - Promosyon Okuma - PaymentScreen ile aynı mantık */}
      {Platform.OS !== 'web' && (
        <Modal
          visible={showCameraModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCameraModal(false)}
        >
          <View style={styles.cameraModalContainer}>
            {(() => {
              const ActualCameraView = cameraModule.CameraView;
              
              // İzin durumu kontrol ediliyor
              if (!permission) {
                return (
                  <View style={styles.cameraPermissionContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.cameraPermissionText}>
                      {t('payment.cameraPreparing') || t('business.cameraPermissionRequired')}
                    </Text>
                  </View>
                );
              }
              
              // İzin verilmemişse - PaymentScreen ile aynı akış
              if (!permission.granted) {
                const canAskAgain = permission.canAskAgain;
                const isDenied = !canAskAgain;
                
                return (
                  <View style={styles.cameraPermissionContainer}>
                    <Text style={styles.cameraPermissionTitle}>
                      {t('payment.scanQR') || t('business.scanQRCode')}
                    </Text>
                    <Text style={styles.cameraPermissionText}>
                      {isDenied
                        ? t('payment.cameraPermissionDenied') || t('business.cameraPermissionRequired')
                        : t('payment.cameraPermissionRequired') || t('business.cameraPermissionRequired')}
                    </Text>
                    
                    {/* İzin İste Butonu - henüz sorulmadıysa */}
                    {canAskAgain && (
                      <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={handleRequestPermission}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.permissionButtonText}>
                          {t('payment.requestPermission') || t('business.cameraPermissionRequired')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Ayarlara Git Butonu - kalıcı olarak reddedilmişse */}
                    {isDenied && (
                      <TouchableOpacity
                        style={styles.permissionButton}
                        onPress={handleOpenSettings}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.permissionButtonText}>
                          {t('payment.openSettings') || t('common.settings')}
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      style={styles.cameraCloseButton}
                      onPress={() => setShowCameraModal(false)}
                    >
                      <Text style={styles.cameraCloseButtonText}>
                        {t('common.close')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              
              // CameraView yoksa
              if (!ActualCameraView) {
                return (
                  <View style={styles.cameraPermissionContainer}>
                    <Text style={styles.cameraPermissionText}>
                      {t('business.cameraNotAvailable')}
                    </Text>
                    <TouchableOpacity
                      style={styles.cameraCloseButton}
                      onPress={() => setShowCameraModal(false)}
                    >
                      <Text style={styles.cameraCloseButtonText}>
                        {t('common.close')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              
              // İzin verildi - Kamera aktif, QR tarama ekranı
              return (
                <>
                  <ActualCameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned || scanProcessing ? undefined : handleQRScanned}
                    barcodeScannerSettings={{
                      barcodeTypes: ['qr'],
                    }}
                  >
                    <View style={styles.cameraOverlay}>
                      <View style={styles.scanArea}>
                        <View style={styles.scanFrame} />
                        <Text style={styles.scanInstruction}>
                          {t('business.scanInstruction')}
                        </Text>
                      </View>
                    </View>
                  </ActualCameraView>
                  
                  {scanProcessing && (
                    <View style={styles.processingOverlay}>
                      <ActivityIndicator size="large" color={colors.white} />
                      <Text style={styles.processingText}>
                        {t('business.processing')}
                      </Text>
                    </View>
                  )}
                  
                  <TouchableOpacity
                    style={styles.cameraCloseButton}
                    onPress={() => setShowCameraModal(false)}
                  >
                    <Text style={styles.cameraCloseButtonText}>
                      {t('common.close')}
                    </Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  businessName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  tagButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  tagButtonTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  noOrderTypesText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.md,
  },
  generateButton: {
    width: '100%',
  },
  scanButton: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  // QR Modal Styles
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
    ...shadows.xlarge,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonText: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
  },
  modalBody: {
    padding: spacing.md,
    alignItems: 'center',
  },
  qrCodeContainer: {
    marginVertical: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 250,
  },
  qrCodePlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  qrCodeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  qrCodeDataText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  qrCodeImage: {
    width: 260,
    height: 260,
    borderRadius: spacing.xs,
  },
  closeModalButton: {
    width: '100%',
    marginTop: spacing.md,
  },
  // Camera Modal Styles
  cameraModalContainer: {
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
  },
  processingText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  cameraCloseButton: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  cameraCloseButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  cameraPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cameraPermissionText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});

export default BusinessHomeScreen;

