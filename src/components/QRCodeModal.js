import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { generatePromotionQRToken } from '../services/qrTokenService';
import { getUserProfile } from '../services/userService';
import { colors, spacing, typography, shadows } from '../theme';

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

/**
 * QR Code Modal Component
 * Promosyon kullanımı için GERÇEK QR Code gösterir
 * JWT benzeri imzalı token içerir
 */
const QRCodeModal = ({ visible, onClose, qrData, venueName }) => {
  const { t } = useTranslation();
  const [qrToken, setQrToken] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null); // Bitmap image (base64)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hata mesajı tekrarını engellemek için ref
  const errorShownRef = useRef(false);

  // QR Token ve Image oluştur
  useEffect(() => {
    if (visible && qrData) {
      // Hata ref'ini sıfırla
      errorShownRef.current = false;
      generateQRToken();
    } else {
      // Modal kapandığında state'i temizle
      setQrToken(null);
      setQrCodeImage(null);
      setError(null);
      errorShownRef.current = false;
    }
  }, [visible, qrData]);

  // QR Token oluştuktan sonra bitmap image üret
  useEffect(() => {
    if (qrToken && Platform.OS !== 'web') {
      // Async fonksiyonu await ile çağır
      generateQRImage().catch(error => {
        console.error('QR Image generation error:', error);
        if (!errorShownRef.current) {
          setError('QR kod görüntüsü oluşturulamadı');
          errorShownRef.current = true;
        }
        setLoading(false);
      });
    }
  }, [qrToken]);

  const generateQRToken = async () => {
    if (!qrData) {
      if (!errorShownRef.current) {
        setError('QR kod verisi bulunamadı');
        errorShownRef.current = true;
      }
      return;
    }

    setLoading(true);
    setError(null);

    // Timeout koruması: 10 saniye içinde tamamlanmazsa hata göster
    const timeoutId = setTimeout(() => {
      if (!errorShownRef.current) {
        setError('QR kod oluşturma zaman aşımına uğradı. Lütfen tekrar deneyin.');
        errorShownRef.current = true;
        setLoading(false);
      }
    }, 10000); // 10 saniye

    try {
      // QR Data: String (JWT token) veya Object (JWT üretilecek)
      // TÜM QR KODLAR JWT TOKEN FORMATINDA ÜRETİLİR/SAKLANIR
      let token;
      let userId;

      // Eğer string gelirse ve JWT formatındaysa direkt kullan
      if (typeof qrData === 'string' && qrData.trim().length > 0) {
        // JWT format kontrolü: 3 parça olmalı (header.payload.signature)
        const parts = qrData.split('.');
        if (parts.length === 3) {
          // Geçerli JWT token formatı, direkt kullan
          token = qrData;
        } else {
          throw new Error('QR kod geçersiz JWT formatı. Beklenen: header.payload.signature');
        }
      } else if (typeof qrData === 'object' && qrData !== null) {
        // Object formatında, JWT token üret
        
        // Kullanıcı profilini al (userId için - optional, mock üretilebilir)
        const userProfile = await getUserProfile();
        userId = userProfile?.id || userProfile?.userId || null; // Optional, mock üretilebilir

        // QR Type kontrolü: ORDER (Business) veya PROMOTION (Customer)
        if (qrData.qrType === 'ORDER' || (qrData.orderTypes && Array.isArray(qrData.orderTypes))) {
          // Business QR (ORDER) - generateBusinessQRCode kullan
          const { generateBusinessQRCode } = await import('../services/businessQRService');
          try {
            // SADECE orderTypes gönder
            token = await generateBusinessQRCode(qrData.orderTypes || []);
            if (!token || typeof token !== 'string' || !token.includes('.')) {
              throw new Error('JWT token geçersiz format');
            }
          } catch (tokenError) {
            console.error('Business QR Token generation error:', tokenError);
            const errorMsg = `QR token oluşturulamadı: ${tokenError.message || 'Bilinmeyen hata'}`;
            if (!errorShownRef.current) {
              setError(errorMsg);
              errorShownRef.current = true;
            }
            clearTimeout(timeoutId);
            return;
          }
        } else {
          // Promotion QR - generatePromotionQRToken kullan
          // SADECE promotionId gönder, diğer her şey mock olarak üretilecek
          const promotionId = qrData.promotionId;
          
          if (!promotionId) {
            const errorMsg = 'Promosyon ID bulunamadı';
            if (!errorShownRef.current) {
              setError(errorMsg);
              errorShownRef.current = true;
            }
            clearTimeout(timeoutId);
            return;
          }

          // QR Token oluştur - try/catch ile sarılmış
          try {
            // SADECE promotionId ve optional userId gönder
            token = await generatePromotionQRToken(promotionId, userId);
            if (!token || typeof token !== 'string' || !token.includes('.')) {
              throw new Error('JWT token geçersiz format');
            }
          } catch (tokenError) {
            console.error('QR Token generation error:', tokenError);
            const errorMsg = `QR token oluşturulamadı: ${tokenError.message || 'Bilinmeyen hata'}`;
            if (!errorShownRef.current) {
              setError(errorMsg);
              errorShownRef.current = true;
            }
            clearTimeout(timeoutId);
            return;
          }
        }
      } else {
        // Geçersiz format
        throw new Error('QR kod verisi string (JWT token) veya object formatında olmalı');
      }

      // Token başarıyla oluşturuldu
      setQrToken(token);
      clearTimeout(timeoutId); // Başarılı olursa timeout'u temizle
    } catch (err) {
      clearTimeout(timeoutId); // Hata olursa timeout'u temizle
      console.error('QR Token generation error:', err);
      const errorMsg = err.message || 'QR kod oluşturulamadı';
      if (!errorShownRef.current) {
        setError(errorMsg);
        errorShownRef.current = true;
      }
    } finally {
      setLoading(false);
    }
  };

  // QR Code bitmap image üret (SVG YOK)
  const generateQRImage = async () => {
    if (!qrToken) {
      return;
    }

    setLoading(true); // QR image üretilirken loading göster
    setError(null);

    try {
      const imageData = await generateQRCodeImage(qrToken, 260);
      if (imageData) {
        setQrCodeImage(imageData);
      } else {
        throw new Error('QR kod görüntüsü oluşturulamadı');
      }
    } catch (error) {
      console.error('QR Image generation error:', error);
      if (!errorShownRef.current) {
        setError('QR kod görüntüsü oluşturulamadı: ' + (error.message || 'Bilinmeyen hata'));
        errorShownRef.current = true;
      }
    } finally {
      setLoading(false); // Loading'i kapat
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('promotions.qrCodeTitle')}</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.venueName}>{venueName || qrData?.venueName}</Text>
                <Text style={styles.instructionText}>
                  {t('promotions.qrCodeInstruction')}
                </Text>

                {/* Gerçek QR Code */}
                <View style={styles.qrCodeContainer}>
                  {loading ? (
                    <View style={styles.qrCodePlaceholder}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={styles.loadingText}>QR kod oluşturuluyor...</Text>
                    </View>
                  ) : error ? (
                    <View style={styles.qrCodePlaceholder}>
                      <Text style={styles.errorText}>{error}</Text>
                      <TouchableOpacity
                        style={styles.retryButton}
                        onPress={generateQRToken}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                      </TouchableOpacity>
                    </View>
                  ) : qrToken && !loading && qrToken.length > 0 ? (
                    <View style={styles.qrCodeWrapper}>
                      {Platform.OS === 'web' ? (
                        // Web için fallback - QR kod verisini göster
                        <View style={styles.webQRFallback}>
                          <Text style={styles.webQRTitle}>QR Code</Text>
                          <Text style={styles.webQRData} selectable>
                            {qrToken.substring(0, 50)}...
                          </Text>
                          <Text style={styles.webQRNote}>
                            Web modunda QR kod görüntülenemez. Token verisi yukarıda gösterilmektedir.
                          </Text>
                        </View>
                      ) : qrCodeImage && qrCodeImage.length > 0 ? (
                        // Bitmap QR Code - SVG YOK, LinearGradient YOK
                        <Image
                          source={{ uri: qrCodeImage }}
                          style={styles.qrCodeImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <View style={styles.qrCodePlaceholder}>
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text style={styles.qrCodeText}>QR kod görüntüsü oluşturuluyor...</Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.qrCodePlaceholder}>
                      <Text style={styles.errorText}>QR kod üretilemedi</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.noteText}>
                  {t('promotions.qrCodeNote')}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    width: '85%',
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
  venueName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  instructionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  qrCodeContainer: {
    marginVertical: spacing.md,
  },
  qrCodePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  qrCodeWrapper: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    padding: spacing.sm,
    ...shadows.small,
  },
  qrCodeImage: {
    width: 260,
    height: 260,
    borderRadius: spacing.xs,
  },
  qrCodeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error || '#ff0000',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  retryButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: spacing.xs,
    marginTop: spacing.sm,
  },
  retryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  webQRFallback: {
    width: 200,
    height: 200,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  webQRTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  webQRData: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontFamily: 'monospace',
  },
  webQRNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  noteText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontStyle: 'italic',
  },
});

export default QRCodeModal;
