import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * Ortak Button Component
 * @param {string} title - Buton metni
 * @param {function} onPress - Tıklama fonksiyonu
 * @param {boolean} loading - Loading durumu
 * @param {string} variant - Button tipi ('primary' | 'secondary')
 */
const Button = ({ title, onPress, loading = false, variant = 'primary' }) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'google' && styles.buttonGoogle,
      ]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === 'primary'
              ? colors.white
              : variant === 'google'
              ? colors.white
              : colors.primary
          }
        />
      ) : (
        <View style={styles.buttonContent}>
          {variant === 'google' && <Text style={styles.googleIcon}>G</Text>}
          <Text
            style={[
              styles.buttonText,
              variant === 'secondary' && styles.buttonTextSecondary,
              variant === 'google' && styles.buttonTextGoogle,
            ]}
          >
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 6, // 14
    paddingHorizontal: spacing.lg, // 24
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  buttonSecondary: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  buttonTextSecondary: {
    color: colors.primary,
  },
  buttonGoogle: {
    backgroundColor: '#4285F4',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: colors.white,
    color: '#4285F4',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: spacing.sm,
  },
  buttonTextGoogle: {
    color: colors.white,
  },
});

export default Button;

