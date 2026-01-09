import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signup } from '../../services/authService';
import { colors, spacing, typography, shadows } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import PhoneInput from '../../components/PhoneInput';
import PasswordInput from '../../components/PasswordInput';
import Logo from '../../components/Logo';

// Ülke listesi - Dropdown'u SignupScreen seviyesinde render etmek için
const COUNTRIES = [
  { code: 'TR', name: 'Türkiye', dialCode: '+90', phoneLength: 10 },
  { code: 'DE', name: 'Almanya', dialCode: '+49', phoneLength: 11 },
  { code: 'US', name: 'ABD', dialCode: '+1', phoneLength: 10 },
  { code: 'UK', name: 'İngiltere', dialCode: '+44', phoneLength: 10 },
];

/**
 * Signup Screen - Micro-Screen Architecture
 * Bu ekran tamamen bağımsızdır, kendi state'ini yönetir
 */
const SignupScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Local state - sadece bu ekrana özel
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('TR');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // Dropdown state - PhoneInput dropdown'unu SignupScreen seviyesinde render etmek için
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phoneInputLayout, setPhoneInputLayout] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Şifre validasyon kuralları - her kuralı ayrı kontrol et
  const passwordRules = useMemo(() => [
    {
      label: t('password.rules.minLength'),
      test: (pwd) => pwd.length >= 8,
    },
    {
      label: t('password.rules.uppercase'),
      test: (pwd) => /[A-Z]/.test(pwd),
    },
    {
      label: t('password.rules.lowercase'),
      test: (pwd) => /[a-z]/.test(pwd),
    },
    {
      label: t('password.rules.number'),
      test: (pwd) => /[0-9]/.test(pwd),
    },
    {
      label: t('password.rules.special'),
      test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    },
  ], [t]);

  // Şifre validasyonu - detaylı kontrol
  const validatePassword = (pwd) => {
    const errors = [];
    passwordRules.forEach((rule) => {
      if (!rule.test(pwd)) {
        errors.push(rule.label);
      }
    });
    return errors;
  };

  // Telefon numarası validasyonu - ülkeye göre dinamik
  const validatePhoneNumber = (phone, countryCode) => {
    const phoneLengths = {
      TR: 10,
      DE: 11,
      US: 10,
      UK: 10,
    };
    const requiredLength = phoneLengths[countryCode] || 10;
    const cleaned = phone.replace(/\s/g, '').replace(/[()-]/g, '');
    return cleaned.length === requiredLength && /^\d+$/.test(cleaned);
  };

  // Form validasyonu
  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) {
      newErrors.fullName = t('auth.fullNameRequired');
    }

    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.invalidEmail');
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = t('auth.phoneRequired');
    } else if (!validatePhoneNumber(phoneNumber, countryCode)) {
      const phoneLengths = { TR: 10, DE: 11, US: 10, UK: 10 };
      const requiredLength = phoneLengths[countryCode] || 10;
      newErrors.phoneNumber = t('auth.phoneLengthError', { length: requiredLength });
    }

    if (!password.trim()) {
      newErrors.password = t('auth.passwordRequired');
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors.join(', ');
      }
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = t('auth.confirmPasswordRequired');
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsNotMatch');
    }

    if (!kvkkAccepted) {
      newErrors.kvkk = t('auth.kvkkRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Signup işlemi
  const handleSignup = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Backend API çağrısı - fullName, countryCode ve phoneNumber gönder
      const cleanedPhone = phoneNumber ? phoneNumber.replace(/\s/g, '').replace(/[()-]/g, '') : '';
      const result = await signup(email, password, {
        fullName: fullName.trim(),
        countryCode,
        phoneNumber: cleanedPhone,
      });
      
      // Email'i AsyncStorage'a kaydet (token ile birlikte)
      try {
        await AsyncStorage.setItem('userEmail', email.toLowerCase().trim());
      } catch (error) {
        console.warn('Email kaydetme hatası:', error);
      }

      // Web'de Alert.alert bazen çalışmıyor, setTimeout ile gecikme ekle
      setTimeout(() => {
        if (Platform.OS === 'web') {
          window.alert(t('auth.signupSuccess'));
          navigation.navigate('Login');
        } else {
          Alert.alert(
            t('common.success'),
            t('auth.signupSuccess'),
            [
              {
                text: t('common.ok'),
                onPress: () => {
                  navigation.navigate('Login');
                },
              },
            ]
          );
        }
      }, 100);
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert(t('common.error') + ': ' + (error.message || t('auth.signupError')));
      } else {
        Alert.alert(t('common.error'), error.message || t('auth.signupError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        // nestedScrollEnabled - iç içe scroll'lar için gerekli
        nestedScrollEnabled={true}
        // ScrollView scroll edildiğinde dropdown'u kapat ve scroll offset'ini kaydet
        onScrollBeginDrag={() => {
          if (showCountryDropdown) {
            setShowCountryDropdown(false);
          }
        }}
        onScroll={(event) => {
          // Scroll offset'ini kaydet - dropdown pozisyonunu doğru hesaplamak için
          setScrollOffset(event.nativeEvent.contentOffset.y);
        }}
        scrollEventThrottle={16}
      >
        <View style={styles.content}>
          <Logo size="large" />
          <Text style={styles.title}>{t('auth.signupTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.signupSubtitle')}</Text>

          <Input
            label={t('auth.fullName')}
            placeholder={t('auth.fullNamePlaceholder')}
            value={fullName}
            onChangeText={setFullName}
            error={errors.fullName}
          />

          <Input
            label={t('auth.email')}
            placeholder={t('auth.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
          />

          <PhoneInput
            label={t('auth.phone')}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            countryCode={countryCode}
            onCountryChange={setCountryCode}
            error={errors.phoneNumber}
            showDropdown={showCountryDropdown}
            onDropdownToggle={setShowCountryDropdown}
            onDropdownSelect={(country) => {
              setCountryCode(country.code);
              setShowCountryDropdown(false);
            }}
            onComboBoxLayout={(layout) => {
              // ComboBox'un pozisyonunu al - dropdown'u ComboBox'un tam altına yerleştirmek için
              setPhoneInputLayout(layout);
            }}
          />

          <PasswordInput
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />

          {/* Şifre Validasyon Kuralları */}
          {password.length > 0 && (
            <View style={styles.validationContainer}>
              {passwordRules.map((rule, index) => {
                const isValid = rule.test(password);
                return (
                  <View key={index} style={styles.validationItem}>
                    <Text
                      style={[
                        styles.validationText,
                        isValid ? styles.validationTextSuccess : styles.validationTextError,
                      ]}
                    >
                      {isValid ? '✓' : '✗'} {rule.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <PasswordInput
            label={t('auth.confirmPassword')}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
          />

          {/* KVKK ve E-posta Onayları */}
          <View style={styles.consentContainer}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setKvkkAccepted(!kvkkAccepted)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, kvkkAccepted && styles.checkboxChecked]}>
                {kvkkAccepted && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkboxTextContainer}>
                <Text style={styles.checkboxText}>
                  <Text
                    style={styles.checkboxTextLink}
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowKvkkModal(true);
                    }}
                  >
                    {t('auth.kvkkAccept')}
                  </Text>
                  <Text style={styles.checkboxTextNormal}> {t('auth.kvkkAcceptSuffix')}</Text>
                </Text>
              </View>
            </TouchableOpacity>

            {errors.kvkk && (
              <Text style={styles.consentError}>{errors.kvkk}</Text>
            )}

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setEmailConsent(!emailConsent)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, emailConsent && styles.checkboxChecked]}>
                {emailConsent && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>{t('auth.emailConsent')}</Text>
            </TouchableOpacity>
          </View>

          <Button
            title={t('auth.signup')}
            onPress={handleSignup}
            loading={loading}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('auth.alreadyHaveAccount')} </Text>
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              {t('auth.loginHere')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Country Dropdown - SignupScreen seviyesinde render ediliyor, ScrollView'in dışında */}
      {showCountryDropdown && phoneInputLayout && (
        <View
          style={[
            styles.countryDropdownOverlay,
            {
              // ComboBox'un tam altından açılması için pozisyon hesaplaması
              // ScrollView scroll offset'ini de hesaba kat
              top: phoneInputLayout.y + phoneInputLayout.height + 4 + scrollOffset, // ComboBox'un hemen altı (4px margin) + scroll offset
              left: phoneInputLayout.x,
              width: phoneInputLayout.width, // ComboBox'un genişliği kadar
            },
          ]}
          pointerEvents="box-none"
        >
          <View style={styles.countryDropdownList}>
            {COUNTRIES.map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.countryDropdownItem,
                  countryCode === item.code && styles.countryDropdownItemSelected,
                ]}
                onPress={() => {
                  setCountryCode(item.code);
                  setShowCountryDropdown(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.countryDropdownCode}>{item.code}</Text>
                <Text style={styles.countryDropdownDialCode}>{item.dialCode}</Text>
                {countryCode === item.code && (
                  <Text style={styles.countryDropdownCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Dropdown dışına tıklanınca kapat */}
      {showCountryDropdown && (
        <TouchableWithoutFeedback onPress={() => setShowCountryDropdown(false)}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* KVKK Modal */}
      <Modal
        visible={showKvkkModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowKvkkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowKvkkModal(false)}>
            <View style={styles.modalOverlayTouchable} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('kvkk.title')}</Text>
            </View>
            <ScrollView 
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              nestedScrollEnabled={Platform.OS === 'android'}
              showsVerticalScrollIndicator={true}
              bounces={Platform.OS === 'ios'}
              scrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
            >
              <Text style={styles.modalText} selectable={true}>
                <Text style={styles.modalTextBold}>{t('kvkk.dataController')}</Text>
                {'\n\n'}
                {t('kvkk.dataControllerText')}
                {'\n\n'}
                <Text style={styles.modalTextBold}>{t('kvkk.processedData')}</Text>
                {'\n\n'}
                {t('kvkk.processedDataItems')}
                {'\n\n'}
                <Text style={styles.modalTextBold}>{t('kvkk.processingPurposes')}</Text>
                {'\n\n'}
                {t('kvkk.processingPurposesItems')}
                {'\n\n'}
                <Text style={styles.modalTextBold}>{t('kvkk.legalBasis')}</Text>
                {'\n\n'}
                {t('kvkk.legalBasisItems')}
                {'\n\n'}
                <Text style={styles.modalTextBold}>{t('kvkk.dataSharing')}</Text>
                {'\n\n'}
                {t('kvkk.dataSharingText')}
                {'\n\n'}
                <Text style={styles.modalTextBold}>{t('kvkk.rights')}</Text>
                {'\n\n'}
                {t('kvkk.rightsText')}
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button
                title={t('common.close')}
                onPress={() => setShowKvkkModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg - 4, // 20
    // overflow: 'visible' - PhoneInput dropdown'unun kesilmemesi için
    overflow: 'visible',
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md - 4, // 12
    padding: spacing.lg,
    ...shadows.medium,
    // overflow: 'visible' - PhoneInput dropdown'unun kesilmemesi için
    overflow: 'visible',
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  validationContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  validationItem: {
    marginBottom: spacing.xs,
  },
  validationText: {
    fontSize: typography.fontSize.xs,
    marginLeft: spacing.sm,
  },
  validationTextError: {
    color: colors.error,
  },
  validationTextSuccess: {
    color: colors.success,
  },
  consentContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: spacing.sm,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  checkboxTextNormal: {
    color: colors.textPrimary,
  },
  checkboxTextLink: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
  consentError: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    marginLeft: 28,
    marginTop: -spacing.xs,
    marginBottom: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    width: '95%',
    maxWidth: 1800,
    // maxHeight kaldırıldı - flex yapısı ile kontrol edilecek
    flexDirection: 'column',
    ...shadows.large,
    overflow: 'hidden',
    // Modal'ın ekran yüksekliğine göre ayarlanması için
    maxHeight: Platform.OS === 'ios' ? '85%' : '90%',
    // Footer'ın her zaman görünür olması için flex yapısı
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.lg + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    zIndex: 1000,
    position: 'relative',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  modalBody: {
    // flex: 1 kaldırıldı - ScrollView'in footer'ı itmesini engellemek için
    // maxHeight kullanarak scroll edilebilir alan sınırlandırıldı
    padding: spacing.xl,
    paddingBottom: spacing.md,
    // ScrollView'in maksimum yüksekliği - footer için yer bırakıyor
    maxHeight: Platform.OS === 'ios' ? 400 : 450,
  },
  modalBodyContent: {
    paddingBottom: spacing.xl,
    // flexGrow kaldırıldı - içerik kadar yer kaplasın
  },
  modalText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 22,
    textAlign: 'left',
  },
  modalTextBold: {
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalFooter: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.lg + 20 : spacing.lg + 8,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    // Footer'ın her zaman görünür ve tıklanabilir olması için
    zIndex: 1000,
    position: 'relative',
    // Footer'ın ekranın altına taşmaması için minHeight yok, padding ile kontrol
    minHeight: 70,
  },
  // Country Dropdown Styles - SignupScreen seviyesinde render ediliyor
  countryDropdownOverlay: {
    position: 'absolute',
    // Tüm inputların üstünde görünmesi için maksimum z-index
    zIndex: 99999,
    ...Platform.select({
      ios: {
        zIndex: 99999,
      },
      android: {
        elevation: 99999,
      },
    }),
  },
  countryDropdownList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  countryDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryDropdownItemSelected: {
    backgroundColor: colors.background,
  },
  countryDropdownCode: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginRight: spacing.xs,
    minWidth: 30,
  },
  countryDropdownDialCode: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    marginLeft: 'auto',
    marginRight: spacing.xs,
  },
  countryDropdownCheckmark: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: 'bold',
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99998,
    ...Platform.select({
      ios: {
        zIndex: 99998,
      },
      android: {
        elevation: 99998,
      },
    }),
  },
});

export default SignupScreen;

