import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, shadows } from '../theme';

/**
 * QR Code Modal Component
 * Promosyon kullanımı için QR Code gösterir
 */
const QRCodeModal = ({ visible, onClose, qrData, venueName }) => {
  const { t } = useTranslation();

  // Mock QR Code - Gerçek ortamda backend'den gelecek veya QR code library kullanılacak
  const generateQRCode = () => {
    // Mock QR data - Gerçek ortamda backend'den gelecek
    return JSON.stringify({
      promotionId: qrData?.promotionId || 0,
      userId: qrData?.userId || 0,
      venueName: venueName || '',
      timestamp: Date.now(),
      type: 'PROMOTION_USE',
    });
  };

  const qrCodeData = generateQRCode();

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
                <Text style={styles.venueName}>{venueName}</Text>
                <Text style={styles.instructionText}>
                  {t('promotions.qrCodeInstruction')}
                </Text>

                {/* QR Code Placeholder - Gerçek ortamda QR code library kullanılacak */}
                <View style={styles.qrCodeContainer}>
                  <View style={styles.qrCodePlaceholder}>
                    <Text style={styles.qrCodeText}>QR CODE</Text>
                    <Text style={styles.qrCodeDataText}>{qrCodeData.substring(0, 30)}...</Text>
                  </View>
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
  qrCodeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  qrCodeDataText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
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
