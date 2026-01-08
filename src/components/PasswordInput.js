import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * PasswordInput Component
 * Şifre input'u ile göz ikonu (toggle visibility)
 */
const PasswordInput = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  editable = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.input,
            error && styles.inputError,
            !editable && styles.inputDisabled,
          ]}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
          editable={editable}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setIsVisible(!isVisible)}
          activeOpacity={0.7}
        >
          <View style={styles.eyeIconContainer}>
            <Text style={styles.eyeIconText}>👁️</Text>
            {!isVisible && <View style={styles.eyeIconLine} />}
          </View>
        </TouchableOpacity>
      </View>
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
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    paddingRight: 50, // Göz ikonu için alan
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
  eyeIcon: {
    position: 'absolute',
    right: spacing.md,
    padding: spacing.xs,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconContainer: {
    position: 'relative',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eyeIconText: {
    fontSize: 20,
  },
  eyeIconLine: {
    position: 'absolute',
    width: 28,
    height: 2.5,
    backgroundColor: colors.error,
    transform: [{ rotate: '45deg' }],
    top: 10,
    left: -2,
    borderRadius: 1,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});

export default PasswordInput;

