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
  
  // BorderRadius: Yuvarlatılmış köşeli kutu - splash.png ile aynı shape (TAM DAİRE DEĞİL)
  // Splash.png'deki gibi görünmesi için: logoSize'ın yaklaşık %20-25'i kadar borderRadius
  // Tam daire olmaması için logoSize/2'den küçük olmalı
  // Küçük logolar için: 30px * 0.2 = 6px, büyük logolar için: 100px * 0.2 = 20px (ama max 16px)
  const borderRadiusValue = Math.min(logoSize * 0.2, spacing.md);
  // Minimum 6px, maksimum spacing.md (16px) - tam daire olmasını engelle
  const borderRadius = Math.max(Math.min(borderRadiusValue, spacing.md), 6);

  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { width: logoSize, height: logoSize, borderRadius }]}>
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
    // borderRadius dinamik olarak component içinde hesaplanıyor
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




