import React, { useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signup } from '../../services/authService';
import { colors, spacing, typography, shadows } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Logo from '../../components/Logo';

/**
 * Signup Screen - Micro-Screen Architecture
 * Bu ekran tamamen bağımsızdır, kendi state'ini yönetir
 */
const SignupScreen = () => {
  const navigation = useNavigation();

  // Local state - sadece bu ekrana özel
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [showKvkkModal, setShowKvkkModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Şifre validasyon kuralları - her kuralı ayrı kontrol et
  const passwordRules = [
    {
      label: 'En az 8 karakter',
      test: (pwd) => pwd.length >= 8,
    },
    {
      label: 'En az 1 büyük harf',
      test: (pwd) => /[A-Z]/.test(pwd),
    },
    {
      label: 'En az 1 küçük harf',
      test: (pwd) => /[a-z]/.test(pwd),
    },
    {
      label: 'En az 1 rakam',
      test: (pwd) => /[0-9]/.test(pwd),
    },
    {
      label: 'En az 1 noktalama işareti',
      test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    },
  ];

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

  // Telefon numarası validasyonu
  const validatePhoneNumber = (phone) => {
    // Türkiye telefon formatı: 05XX XXX XX XX veya +90 5XX XXX XX XX
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    const cleanedPhone = phone.replace(/\s/g, '').replace(/[()-]/g, '');
    return phoneRegex.test(cleanedPhone);
  };

  // Form validasyonu
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir email adresi giriniz';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Cep telefonu numarası gereklidir';
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Geçerli bir telefon numarası giriniz (05XX XXX XX XX)';
    }

    if (!password.trim()) {
      newErrors.password = 'Şifre gereklidir';
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        newErrors.password = passwordErrors.join(', ');
      }
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (!kvkkAccepted) {
      newErrors.kvkk = 'KVKK şartlarını kabul etmelisiniz';
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
      // Backend API çağrısı - telefon numarasını da gönder
      const cleanedPhone = phoneNumber ? phoneNumber.replace(/\s/g, '').replace(/[()-]/g, '') : '';
      const result = await signup(email, password, cleanedPhone);
      
      // Email'i AsyncStorage'a kaydet (token ile birlikte)
      try {
        await AsyncStorage.setItem('userEmail', email.toLowerCase().trim());
      } catch (error) {
        console.warn('Email kaydetme hatası:', error);
      }

      // Web'de Alert.alert bazen çalışmıyor, setTimeout ile gecikme ekle
      setTimeout(() => {
        if (Platform.OS === 'web') {
          window.alert('Kayıt işlemi tamamlandı. Giriş yapabilirsiniz.');
          navigation.navigate('Login');
        } else {
          Alert.alert(
            'Başarılı',
            'Kayıt işlemi tamamlandı. Giriş yapabilirsiniz.',
            [
              {
                text: 'Tamam',
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
        window.alert('Hata: ' + (error.message || 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.'));
      } else {
        Alert.alert('Hata', error.message || 'Kayıt işlemi başarısız. Lütfen tekrar deneyin.');
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
      >
        <View style={styles.content}>
          <Logo size="large" />
          <Text style={styles.title}>Kayıt Ol</Text>
          <Text style={styles.subtitle}>Yeni hesap oluşturun</Text>

          <Input
            label="Email"
            placeholder="ornek@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
          />

          <Input
            label="Cep Telefonu"
            placeholder="05XX XXX XX XX"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            error={errors.phoneNumber}
          />

          <Input
            label="Şifre"
            placeholder="Şifrenizi giriniz"
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

          <Input
            label="Şifre Tekrar"
            placeholder="Şifrenizi tekrar giriniz"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
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
                    KVKK şartlarını
                  </Text>
                  <Text style={styles.checkboxTextNormal}> onaylıyorum</Text>
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
              <Text style={styles.checkboxText}>Reklam ve tanıtım için e-posta onayı veriyorum</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Kayıt Ol"
            onPress={handleSignup}
            loading={loading}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
            <Text
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              Giriş Yap
            </Text>
          </View>
        </View>
      </ScrollView>

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
              <Text style={styles.modalTitle}>KVKK Aydınlatma Metni</Text>
              <TouchableOpacity
                onPress={() => setShowKvkkModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
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
                <Text style={styles.modalTextBold}>1. Veri Sorumlusu:</Text>
                {'\n\n'}
                Lucky Table uygulaması kapsamında kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca işlenmektedir.
                {'\n\n'}
                <Text style={styles.modalTextBold}>2. İşlenen Kişisel Veriler:</Text>
                {'\n\n'}
                • E-posta adresi{'\n'}
                • Telefon numarası{'\n'}
                • Şifre (şifrelenmiş olarak){'\n'}
                • Konum bilgisi (izin verilmesi halinde){'\n'}
                • Kullanım verileri
                {'\n\n'}
                <Text style={styles.modalTextBold}>3. Veri İşleme Amaçları:</Text>
                {'\n\n'}
                • Hesap oluşturma ve yönetimi{'\n'}
                • Hizmet sunumu{'\n'}
                • İletişim ve müşteri desteği{'\n'}
                • Yasal yükümlülüklerin yerine getirilmesi
                {'\n\n'}
                <Text style={styles.modalTextBold}>4. Veri İşleme Hukuki Sebepleri:</Text>
                {'\n\n'}
                • Açık rıza{'\n'}
                • Sözleşmenin kurulması ve ifası{'\n'}
                • Yasal yükümlülüklerin yerine getirilmesi
                {'\n\n'}
                <Text style={styles.modalTextBold}>5. Verilerin Paylaşılması:</Text>
                {'\n\n'}
                Kişisel verileriniz, yukarıda belirtilen amaçlar doğrultusunda, yasal zorunluluklar çerçevesinde yetkili kamu kurum ve kuruluşları ile paylaşılabilir.
                {'\n\n'}
                <Text style={styles.modalTextBold}>6. Haklarınız:</Text>
                {'\n\n'}
                KVKK'nın 11. maddesi uyarınca, kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işleme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini isteme, düzeltme/silme/yok etme işlemlerinin aktarıldığı üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemler ile analiz edilmesi nedeniyle aleyhinize bir sonuç doğmasına itiraz etme ve kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme haklarına sahipsiniz.
                {'\n\n'}
                <Text style={styles.modalTextBold}>7. İletişim:</Text>
                {'\n\n'}
                Haklarınızı kullanmak için bizimle iletişime geçebilirsiniz.
              </Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Button
                title="Kapat"
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
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md - 4, // 12
    padding: spacing.lg,
    ...shadows.medium,
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
    maxHeight: '90%',
    minHeight: 600, // Uzunluğu 3 katına çıkar (200 -> 600)
    flexDirection: 'column',
    ...shadows.large,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  modalBody: {
    flex: 1,
    padding: spacing.xl,
    minHeight: 500,
  },
  modalBodyContent: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default SignupScreen;

