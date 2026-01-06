import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

/**
 * Logo Component - Lucky Table
 * SVG logo yerine text-based logo kullanıyoruz
 */
const Logo = ({ size = 'large' }) => {
  const logoSize = size === 'large' ? 80 : size === 'medium' ? 60 : 40;
  const fontSize = size === 'large' ? 32 : size === 'medium' ? 24 : 18;

  return (
    <View style={styles.container}>
      <View style={[styles.logoContainer, { width: logoSize, height: logoSize }]}>
        {/* Masa sembolü */}
        <View style={styles.table}>
          <View style={styles.tableTop} />
          <View style={styles.tableLegs}>
            <View style={styles.leg} />
            <View style={styles.leg} />
          </View>
        </View>
        {/* Yıldız sembolü */}
        <Text style={[styles.star, { fontSize: fontSize * 0.6 }]}>⭐</Text>
      </View>
      <Text style={[styles.text, { fontSize }]}>Lucky Table</Text>
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
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  table: {
    position: 'relative',
    width: '100%',
    height: '60%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tableTop: {
    width: '80%',
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableLegs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    paddingHorizontal: 8,
  },
  leg: {
    width: 6,
    height: 12,
    backgroundColor: colors.secondary,
    borderRadius: 3,
  },
  star: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  text: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
});

export default Logo;




