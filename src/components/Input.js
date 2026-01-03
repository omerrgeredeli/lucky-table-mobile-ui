import React from 'react';
import { TextInput, StyleSheet, View, Text } from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * Ortak Input Component
 * @param {string} label - Input etiketi
 * @param {string} placeholder - Placeholder metni
 * @param {string} value - Input değeri
 * @param {function} onChangeText - Değişiklik fonksiyonu
 * @param {string} keyboardType - Klavye tipi
 * @param {boolean} secureTextEntry - Şifre input mu?
 * @param {string} error - Hata mesajı
 * @param {boolean} editable - Düzenlenebilir mi?
 * @param {boolean} multiline - Çok satırlı mı?
 * @param {number} numberOfLines - Satır sayısı
 */
const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  error,
  editable = true,
  multiline = false,
  numberOfLines = 1,
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, !editable && styles.inputDisabled]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable}
        multiline={multiline}
        numberOfLines={numberOfLines}
        placeholderTextColor={colors.textSecondary}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4, // 12
    fontSize: typography.fontSize.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  inputDisabled: {
    backgroundColor: colors.background,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});

export default Input;

