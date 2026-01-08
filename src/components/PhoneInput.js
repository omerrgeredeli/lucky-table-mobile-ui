import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * Ülke listesi (mock)
 */
const COUNTRIES = [
  { code: 'TR', name: 'Türkiye', dialCode: '+90', flag: '🇹🇷', phoneLength: 10 },
  { code: 'DE', name: 'Almanya', dialCode: '+49', flag: '🇩🇪', phoneLength: 11 },
  { code: 'US', name: 'ABD', dialCode: '+1', flag: '🇺🇸', phoneLength: 10 },
  { code: 'UK', name: 'İngiltere', dialCode: '+44', flag: '🇬🇧', phoneLength: 10 },
];

/**
 * PhoneInput Component
 * Ülke kodu seçimi + telefon numarası input'u
 */
const PhoneInput = ({
  label = 'Cep Telefonu',
  value = '',
  onChangeText,
  countryCode = 'TR',
  onCountryChange,
  error,
  // Dropdown state'ini parent'a taşımak için callback'ler
  showDropdown = false,
  onDropdownToggle,
  onDropdownSelect,
  // ComboBox pozisyonunu parent'a iletmek için
  onComboBoxLayout,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0]
  );

  // countryCode prop'u değiştiğinde selectedCountry'i güncelle
  useEffect(() => {
    const country = COUNTRIES.find((c) => c.code === countryCode);
    if (country) {
      setSelectedCountry(country);
    }
  }, [countryCode]);

  const handleToggle = () => {
    if (onDropdownToggle) {
      onDropdownToggle(!showDropdown);
    }
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    if (onDropdownSelect) {
      onDropdownSelect(country);
    }
    if (onDropdownToggle) {
      onDropdownToggle(false);
    }
    if (onCountryChange) {
      onCountryChange(country.code);
    }
  };

  const validatePhoneLength = (phone) => {
    const cleaned = phone.replace(/\s/g, '').replace(/[()-]/g, '');
    return cleaned.length === selectedCountry.phoneLength;
  };

  const formatPhoneNumber = (text) => {
    // Sadece rakamları al
    const cleaned = text.replace(/\D/g, '');
    return cleaned;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.phoneContainer}>
        {/* Ülke Kodu Seçimi - Dropdown */}
        <View 
          style={styles.countrySelectorWrapper}
          onLayout={(event) => {
            // ComboBox'un pozisyonunu parent'a ilet
            if (onComboBoxLayout) {
              const { x, y, width, height } = event.nativeEvent.layout;
              onComboBoxLayout({ x, y, width, height });
            }
          }}
        >
          <TouchableOpacity
            style={[styles.countrySelector, error && styles.countrySelectorError]}
            onPress={handleToggle}
            activeOpacity={0.7}
          >
            <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
            <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
            <Text style={styles.arrow}>{showDropdown ? '▲' : '▼'}</Text>
          </TouchableOpacity>
        </View>

        {/* Telefon Numarası Input */}
        <TextInput
          style={[
            styles.phoneInput,
            error && styles.phoneInputError,
            { flex: 1 },
          ]}
          placeholder={`${selectedCountry.phoneLength} haneli numara`}
          value={value}
          onChangeText={(text) => {
            const formatted = formatPhoneNumber(text);
            if (onChangeText) {
              onChangeText(formatted);
            }
          }}
          keyboardType="phone-pad"
          maxLength={selectedCountry.phoneLength}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Validation Mesajı */}
      {error && <Text style={styles.errorText}>{error}</Text>}
      {!error && value.length > 0 && !validatePhoneLength(value) && (
        <Text style={styles.validationText}>
          Telefon numarası {selectedCountry.phoneLength} haneli olmalıdır
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    // overflow: 'visible' - dropdown'un kesilmemesi için parent container overflow'u visible olmalı
    overflow: 'visible',
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    // overflow: 'visible' - dropdown'un kesilmemesi için
    overflow: 'visible',
  },
  countrySelectorWrapper: {
    position: 'relative',
    // zIndex ve elevation kaldırıldı - dropdown artık SignupScreen seviyesinde render edilecek
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 4,
    backgroundColor: colors.surface,
    minWidth: 130,
  },
  countrySelectorError: {
    borderColor: colors.error,
  },
  countryCodeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginRight: spacing.xs,
  },
  dialCode: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.xs,
    minWidth: 35,
  },
  arrow: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  // dropdownList style'ı kaldırıldı - dropdown artık SignupScreen'de render edilecek
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10001,
  },
  dropdownItemSelected: {
    backgroundColor: colors.background,
  },
  dropdownCode: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginRight: spacing.xs,
    minWidth: 30,
  },
  dropdownDialCode: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginLeft: 'auto',
    marginRight: spacing.xs,
  },
  dropdownCheckmark: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: typography.fontSize.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  phoneInputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  validationText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});

export default PhoneInput;

