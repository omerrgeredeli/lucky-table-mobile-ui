import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, shadows } from '../theme';

/**
 * Logo Component - Lucky Table
 * Büyük L harfi ile modern logo tasarımı
 */
const Logo = ({ size = 'large' }) => {
  // size === 'small' için zil ikonu boyutunda (24px font size'a göre ~30px logo)
  const logoSize = size === 'large' ? 100 : size === 'medium' ? 80 : size === 'small' ? 30 : 60;
  const fontSize = size === 'large' ? 72 : size === 'medium' ? 56 : size === 'small' ? 22 : 42;
  const textSize = size === 'large' ? 24 : size === 'medium' ? 20 : size === 'small' ? 12 : 16;
  const lineHeight = logoSize;

  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { width: logoSize, height: logoSize }]}>
        {/* Büyük L harfi */}
        <Text style={[styles.letterL, { fontSize, lineHeight }]}>L</Text>
      </View>
      <Text style={[styles.text, { fontSize: textSize }]}>Lucky Table</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: spacing.md,
    ...shadows.medium,
  },
  letterL: {
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 0,
    textAlign: 'center',
  },
  text: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default Logo;




