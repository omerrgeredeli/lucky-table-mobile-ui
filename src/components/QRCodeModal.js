import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { generatePromotionQRToken } from '../services/qrTokenService';
import { getUserProfile } from '../services/userService';
import { colors, spacing, typography, shadows } from '../theme';

// QR Code import - Lazy loading (web'de hiç yüklenmez)
// NOT: require() çağrısı fonksiyon içinde olmalı, dosya seviyesinde DEĞİL
const loadQRCode = () => {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    // require() sadece native platformlarda çalışır
    return require('react-native-qrcode-svg').default;
  } catch (error) {
    console.warn('QR Code library not available:', error);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // QR Token oluştur
  useEffect(() => {
    if (visible && qrData) {
      generateQRToken();
    } else {
      // Modal kapandığında state'i temizle
      setQrToken(null);
      setError(null);
    }
  }, [visible, qrData]);

  const generateQRToken = async () => {
    if (!qrData) {
      setError('Promosyon bilgisi bulunamadı');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // PAYLOAD VALIDATION - Gerekli alanları kontrol et
      const requiredFields = ['promotionId', 'venueName', 'promotionType', 'promotionExpireDate'];
      const missingFields = [];
      
      for (const field of requiredFields) {
        if (!qrData[field] && qrData[field] !== 0) {
          missingFields.push(field);
        }
      }
      
      if (missingFields.length > 0) {
        throw new Error(`Eksik alanlar: ${missingFields.join(', ')}`);
      }

      // Kullanıcı profilini al (userId için)
      const userProfile = await getUserProfile();
      const userId = userProfile?.id || userProfile?.userId;

      if (!userId) {
        throw new Error('Kullanıcı bilgisi alınamadı');
      }

      // QR Token oluştur - try/catch ile sarılmış
      let token;
      try {
        token = await generatePromotionQRToken(qrData, userId);
        if (!token || typeof token !== 'string') {
          throw new Error('QR token geçersiz format');
        }
      } catch (tokenError) {
        console.error('QR Token generation error:', tokenError);
        throw new Error(`QR token oluşturulamadı: ${tokenError.message || 'Bilinmeyen hata'}`);
      }

      setQrToken(token);
    } catch (err) {
      console.error('QR Token generation error:', err);
      setError(err.message || 'QR kod oluşturulamadı');
    } finally {
      setLoading(false);
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
                  ) : qrToken ? (
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
                      ) : (() => {
                        const QRCodeComponent = loadQRCode();
                        return QRCodeComponent ? (
                          // Sade QR Code - gradient, logo, fancy props YOK
                          <QRCodeComponent
                            value={qrToken}
                            size={260}
                            backgroundColor="white"
                            color="black"
                          />
                        ) : (
                          <View style={styles.qrCodePlaceholder}>
                            <Text style={styles.qrCodeText}>QR kod yükleniyor...</Text>
                          </View>
                        );
                      })()}
                    </View>
                  ) : (
                    <View style={styles.qrCodePlaceholder}>
                      <Text style={styles.qrCodeText}>QR kod hazırlanıyor...</Text>
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
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    padding: spacing.sm,
    ...shadows.small,
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
