import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

/**
 * Ülke listesi - Tüm dil seçeneklerindeki ülkelerin telefon kodları
 */
const COUNTRIES = [
  { code: 'TR', name: 'Türkiye', dialCode: '+90', flag: '🇹🇷', phoneLength: 10 },
  { code: 'US', name: 'ABD', dialCode: '+1', flag: '🇺🇸', phoneLength: 10 },
  { code: 'UK', name: 'İngiltere', dialCode: '+44', flag: '🇬🇧', phoneLength: 10 },
  { code: 'FR', name: 'Fransa', dialCode: '+33', flag: '🇫🇷', phoneLength: 9 },
  { code: 'DE', name: 'Almanya', dialCode: '+49', flag: '🇩🇪', phoneLength: 11 },
  { code: 'IT', name: 'İtalya', dialCode: '+39', flag: '🇮🇹', phoneLength: 10 },
  { code: 'RU', name: 'Rusya', dialCode: '+7', flag: '🇷🇺', phoneLength: 10 },
  { code: 'ES', name: 'İspanya', dialCode: '+34', flag: '🇪🇸', phoneLength: 9 },
  { code: 'JP', name: 'Japonya', dialCode: '+81', flag: '🇯🇵', phoneLength: 10 },
  { code: 'CN', name: 'Çin', dialCode: '+86', flag: '🇨🇳', phoneLength: 11 },
  { code: 'AZ', name: 'Azerbaycan', dialCode: '+994', flag: '🇦🇿', phoneLength: 9 },
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
  const [inputLayout, setInputLayout] = useState(null);

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
        {/* Ülke Kodu Seçimi - Dropdown Container */}
        <View 
          style={styles.countrySelectorWrapper}
          onLayout={(event) => {
            const { x, y, width, height } = event.nativeEvent.layout;
            setInputLayout({ x, y, width, height });
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

      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="none"
        onRequestClose={() => {
          if (onDropdownToggle) {
            onDropdownToggle(false);
          }
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            if (onDropdownToggle) {
              onDropdownToggle(false);
            }
          }}
        >
          {inputLayout && (
          <View
            style={[
              styles.modalDropdownContainer,
              {
                top: inputLayout.y + inputLayout.height + 2,
                left: inputLayout.x,
                width: inputLayout.width,
                maxHeight: 300,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.dropdownListInner}>
              <FlatList
                data={COUNTRIES}
                keyExtractor={(item) => item.code}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
                scrollEnabled={true}
                style={styles.dropdownScrollView}
                contentContainerStyle={{paddingBottom: 8}}
                bounces={false}
                alwaysBounceVertical={false}
                keyboardShouldPersistTaps="handled"
                removeClippedSubviews={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      countryCode === item.code && styles.dropdownItemSelected,
                    ]}
                    onPress={() => handleCountrySelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dropdownCode}>{item.code}</Text>
                    <Text style={styles.dropdownDialCode}>{item.dialCode}</Text>
                    {countryCode === item.code && (
                      <Text style={styles.dropdownCheckmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
          )}
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  modalDropdownContainer: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  dropdownListInner: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    maxHeight: 300,
    overflow: 'hidden',
  },
  dropdownScrollView: {
    flex: 1,
    maxHeight: 300,
  },
  dropdownScrollContent: {
    paddingVertical: 0,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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

