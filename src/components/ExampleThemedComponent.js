import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows } from '../theme';

/**
 * Örnek Tema Kullanımı Component'i
 * Bu component tema dosyalarından renk, spacing, typography ve shadow kullanımını gösterir
 * 
 * Kullanım:
 * - Renkler: colors.primary, colors.background, colors.textPrimary vb.
 * - Spacing: spacing.xs, spacing.sm, spacing.md, spacing.lg, spacing.xl
 * - Typography: typography.fontSize.md, typography.fontWeight.semibold vb.
 * - Shadows: shadows.small, shadows.medium, shadows.large
 */
const ExampleThemedComponent = () => {
  return (
    <View style={styles.container}>
      {/* Arka plan rengi theme'den geliyor */}
      <View style={styles.card}>
        {/* Primary renkli buton */}
        <View style={styles.button}>
          <Text style={styles.buttonText}>Primary Button</Text>
        </View>

        {/* Text stilleri typography üzerinden alınıyor */}
        <Text style={styles.title}>Başlık Metni</Text>
        <Text style={styles.subtitle}>Alt başlık metni</Text>
        <Text style={styles.bodyText}>
          Bu bir örnek component'tir. Tüm renkler, spacing değerleri, 
          font boyutları ve gölgeler theme dosyalarından import edilmiştir.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Container - background rengi theme'den
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  
  // Card - surface rengi ve shadow theme'den
  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    padding: spacing.lg,
    ...shadows.medium, // Shadow theme'den
  },
  
  // Button - primary renk theme'den
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 4, // 12
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  
  // Button text - typography theme'den
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  
  // Title - typography ve colors theme'den
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  
  // Subtitle - typography ve colors theme'den
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  
  // Body text - typography ve colors theme'den
  bodyText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.normal,
    color: colors.textPrimary,
    lineHeight: typography.lineHeight.md,
  },
});

export default ExampleThemedComponent;

