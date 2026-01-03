import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography, shadows } from '../../theme';
import { getUserLoyaltyInfo } from '../../services/userService';

/**
 * Payment Screen - Ödeme Yap
 * QR kod okuma ve sipariş sayısını artırma
 */
const PaymentScreen = () => {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);

  // QR kod tarama simülasyonu
  const handleScanQR = async () => {
    setScanning(true);
    setLoading(true);

    // Simüle edilmiş QR kod tarama
    setTimeout(() => {
      // QR kod başarıyla okundu
      handleQRCodeScanned('MOCK_QR_CODE_123');
    }, 2000);
  };

  // QR kod okunduğunda
  const handleQRCodeScanned = async (qrCode) => {
    try {
      // Backend'e QR kod gönderilecek ve sipariş sayısı artırılacak
      // Şimdilik simüle ediyoruz
      
      setLoading(false);
      setScanning(false);

      Alert.alert(
        'Başarılı',
        'QR kod başarıyla okundu. Sipariş sayınız güncellendi.',
        [{ text: 'Tamam' }]
      );

      // Sadakat bilgilerini yenile
      await getUserLoyaltyInfo();
    } catch (error) {
      setLoading(false);
      setScanning(false);
      Alert.alert('Hata', 'QR kod okunamadı. Lütfen tekrar deneyin.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>QR Kod Okut</Text>
        <Text style={styles.subtitle}>
          Kamerayı QR koda doğrultun
        </Text>

        {/* QR Kod Tarama Alanı */}
        <View style={styles.scannerContainer}>
          {scanning ? (
            <View style={styles.scannerActive}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.scannerText}>QR kod taranıyor...</Text>
            </View>
          ) : (
            <View style={styles.scannerPlaceholder}>
              <Text style={styles.scannerIcon}>📷</Text>
              <Text style={styles.scannerPlaceholderText}>
                QR kod okutmak için butona basın
              </Text>
            </View>
          )}
        </View>

        {/* Tarama Butonu */}
        <TouchableOpacity
          style={[styles.scanButton, (scanning || loading) && styles.scanButtonDisabled]}
          onPress={handleScanQR}
          disabled={scanning || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.scanButtonText}>
              {scanning ? 'Taranıyor...' : 'QR Kod Okut'}
            </Text>
          )}
        </TouchableOpacity>

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
  },
  scannerActive: {
    alignItems: 'center',
  },
  scannerText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  scannerPlaceholder: {
    alignItems: 'center',
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
  infoText: {
    marginTop: spacing.xl,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default PaymentScreen;

