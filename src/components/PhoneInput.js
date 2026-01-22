import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors, spacing, typography } from '../theme';

const COUNTRIES = [
  { code: 'TR', name: 'Türkiye', dialCode: '+90', phoneLength: 10 },
  { code: 'US', name: 'ABD', dialCode: '+1', phoneLength: 10 },
  { code: 'UK', name: 'İngiltere', dialCode: '+44', phoneLength: 10 },
  { code: 'FR', name: 'Fransa', dialCode: '+33', phoneLength: 9 },
  { code: 'DE', name: 'Almanya', dialCode: '+49', phoneLength: 11 },
  { code: 'IT', name: 'İtalya', dialCode: '+39', phoneLength: 10 },
  { code: 'RU', name: 'Rusya', dialCode: '+7', phoneLength: 10 },
  { code: 'ES', name: 'İspanya', dialCode: '+34', phoneLength: 9 },
  { code: 'JP', name: 'Japonya', dialCode: '+81', phoneLength: 10 },
  { code: 'CN', name: 'Çin', dialCode: '+86', phoneLength: 11 },
  { code: 'AZ', name: 'Azerbaycan', dialCode: '+994', phoneLength: 9 },
];

const PhoneInput = ({
  label,
  value,
  onChangeText,
  countryCode,
  onCountryChange,
  error,
  showDropdown,
  onDropdownToggle,
}) => {
  const selectorRef = useRef(null);
  const [dropdownPos, setDropdownPos] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0]
  );

  useEffect(() => {
    const found = COUNTRIES.find(c => c.code === countryCode);
    if (found) setSelectedCountry(found);
  }, [countryCode]);

  const openDropdown = () => {
    if (!selectorRef.current) return;

    selectorRef.current.measureInWindow((x, y, width, height) => {
      setDropdownPos({ x, y, width, height });
      onDropdownToggle(true);
    });
  };

  const selectCountry = (country) => {
    setSelectedCountry(country);
    onCountryChange(country.code);
    onDropdownToggle(false);
  };

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.row}>
        <TouchableOpacity
          ref={selectorRef}
          style={[styles.countryBox, error && styles.errorBorder]}
          onPress={openDropdown}
          activeOpacity={0.7}
        >
          <Text style={styles.code}>{selectedCountry.code}</Text>
          <Text style={styles.dial}>{selectedCountry.dialCode}</Text>
          <Text style={styles.arrow}>▼</Text>
        </TouchableOpacity>

        <TextInput
          style={[styles.input, error && styles.errorBorder]}
          keyboardType="phone-pad"
          value={value}
          maxLength={selectedCountry.phoneLength}
          onChangeText={text => onChangeText(text.replace(/\D/g, ''))}
          placeholder={`${selectedCountry.phoneLength} haneli`}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Modal visible={showDropdown} transparent animationType="none">
        <View style={styles.modalRoot}>
          <TouchableWithoutFeedback onPress={() => onDropdownToggle(false)}>
            <View style={StyleSheet.absoluteFillObject} />
          </TouchableWithoutFeedback>

          {dropdownPos && (
            <View
              style={[
                styles.dropdown,
                {
                  top: dropdownPos.y + dropdownPos.height,
                  left: dropdownPos.x,
                  width: dropdownPos.width,
                },
              ]}
            >
              <FlatList
                data={COUNTRIES}
                keyExtractor={item => item.code}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                removeClippedSubviews={false}
                style={{ maxHeight: 300 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => selectCountry(item)}
                  >
                    <Text>{item.code}</Text>
                    <Text style={{ marginLeft: 'auto' }}>{item.dialCode}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  countryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    borderRadius: spacing.sm,
    minWidth: 120,
    backgroundColor: colors.surface,
  },
  code: { marginRight: 4 },
  dial: { fontWeight: 'bold' },
  arrow: { marginLeft: 'auto', fontSize: 10 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    padding: spacing.sm,
  },
  modalRoot: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 30,
    zIndex: 9999,
  },
  item: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  error: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginTop: 4,
  },
  errorBorder: {
    borderColor: colors.error,
  },
});

export default PhoneInput;
