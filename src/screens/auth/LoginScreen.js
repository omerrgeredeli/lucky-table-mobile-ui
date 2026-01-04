import React, { useState, useContext, useEffect } from 'react';
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
import { AuthContext } from '../../context/AuthContext';
import { login, sendActivationCode } from '../../services/authService';
import { colors, spacing, typography, shadows } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Logo from '../../components/Logo';

/**
 * Login Screen - Micro-Screen Architecture
 * Bu ekran tamamen bağımsızdır, kendi state'ini yönetir
 */
const LoginScreen = () => {
  const navigation = useNavigation();
  const { login: authLogin } = useContext(AuthContext);

  // Local state - sadece bu ekrana özel
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Üyelik iptali sonrası Signup'a yönlendirme kontrolü
  useEffect(() => {
    checkRedirectToSignup();
  }, []);

  const checkRedirectToSignup = async () => {
    try {
      const redirectToSignup = await AsyncStorage.getItem('redirectToSignup');
      if (redirectToSignup === 'true') {
        await AsyncStorage.removeItem('redirectToSignup');
        navigation.navigate('Signup');
      }
    } catch (error) {
      console.error('Error checking redirect flag:', error);
    }
  };

  // Email veya telefon kontrolü
  const isEmail = (value) => {
    return /\S+@\S+\.\S+/.test(value);
  };

  const isPhone = (value) => {
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    const cleanedPhone = value.replace(/\s/g, '').replace(/[()-]/g, '');
    return phoneRegex.test(cleanedPhone);
  };

  // Form validasyonu
  const validateForm = () => {
    const newErrors = {};

    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email veya telefon numarası gereklidir';
    } else if (!isEmail(emailOrPhone) && !isPhone(emailOrPhone)) {
      newErrors.emailOrPhone = 'Geçerli bir email adresi veya telefon numarası giriniz';
    }

    if (!password.trim()) {
      newErrors.password = 'Şifre gereklidir';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Giriş tipini belirle
  const getLoginType = () => {
    if (isEmail(emailOrPhone)) return 'email';
    if (isPhone(emailOrPhone)) return 'phone';
    return null;
  };

  // Aktivasyon kodu validasyonu
  const validateActivationCode = () => {
    if (!activationCode.trim()) {
      const message = 'Aktivasyon kodunu giriniz';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Hata', message);
      }
      return false;
    }
    if (activationCode.length !== 6) {
      const message = 'Aktivasyon kodu 6 haneli olmalıdır';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Hata', message);
      }
      return false;
    }
    return true;
  };

  // Normal giriş (email/telefon + şifre ile) - Önce bilgileri kontrol et, doğruysa aktivasyon kodu gönder
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Önce kullanıcıyı ve şifreyi kontrol et (mock servis ile)
      const { USE_MOCK_API } = await import('../../config/api');
      
      if (USE_MOCK_API) {
        // Mock modunda: Önce kullanıcıyı bul ve şifreyi kontrol et
        const { getAllUsers } = await import('../../services/mock/mockUserStore');
        const allUsers = getAllUsers();
        
        let foundUser = null;
        const cleanedInput = emailOrPhone.replace(/\s/g, '').replace(/[()-]/g, '');
        
        // Email veya telefon ile kullanıcı bul
        if (isEmail(emailOrPhone)) {
          foundUser = allUsers.find(u => u.email.toLowerCase() === emailOrPhone.toLowerCase().trim());
        } else if (isPhone(emailOrPhone)) {
          foundUser = allUsers.find(u => {
            const userPhone = u.phone?.replace(/\s/g, '').replace(/[()-]/g, '');
            return userPhone === cleanedInput;
          });
        }
        
        // Kullanıcı bulunamadı
        if (!foundUser) {
          setLoading(false);
          const message = 'Böyle bir mail adresi ya da telefon kayıtlı değil';
          if (Platform.OS === 'web') {
            window.alert(message);
          } else {
            Alert.alert('Hata', message);
          }
          return;
        }
        
        // Şifre kontrolü
        if (foundUser.password !== password) {
          setLoading(false);
          const message = 'Lütfen şifrenizi tekrar giriniz';
          if (Platform.OS === 'web') {
            window.alert(message);
          } else {
            Alert.alert('Hata', message);
          }
          return;
        }
        
        // Bilgiler doğru - aktivasyon kodu gönder
        const result = await sendActivationCode(emailOrPhone);
        setShowActivationModal(true);
        setTimeout(() => {
          const infoMessage = result.message || 'Aktivasyon kodu gönderildi';
          if (Platform.OS === 'web') {
            window.alert(infoMessage);
          } else {
            Alert.alert('Bilgi', infoMessage);
          }
        }, 100);
      } else {
        // Real API modunda: Normal login yap
        const response = await login(emailOrPhone, password);
        await authLogin(response.token);
      }
    } catch (error) {
      // Hata mesajlarını kontrol et
      const errorMessage = error.message || 'Giriş yapılamadı. Lütfen tekrar deneyin.';
      let displayMessage = errorMessage;
      
      if (error.message.includes('kayıtlı değil') || error.message.includes('USER_NOT_FOUND')) {
        displayMessage = 'Böyle bir mail adresi ya da telefon kayıtlı değil';
      } else if (error.message.includes('şifre') || error.message.includes('INVALID_PASSWORD')) {
        displayMessage = 'Lütfen şifrenizi tekrar giriniz';
      }
      
      if (Platform.OS === 'web') {
        window.alert(displayMessage);
      } else {
        Alert.alert('Hata', displayMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Aktivasyon kodu gönderme
  const handleSendActivationCode = async () => {
    if (!emailOrPhone.trim()) {
      const message = 'Email veya telefon numarası giriniz';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Hata', message);
      }
      return;
    }

    setLoading(true);
    try {
      // Backend'e aktivasyon kodu gönderme isteği
      const result = await sendActivationCode(emailOrPhone);
      
      // Aktivasyon kodu modal'ını aç
      setShowActivationModal(true);
      
      // Bilgi mesajı
      setTimeout(() => {
        const infoMessage = result.message || 'Aktivasyon kodu gönderildi';
        if (Platform.OS === 'web') {
          window.alert(infoMessage);
        } else {
          Alert.alert('Bilgi', infoMessage);
        }
      }, 100);
    } catch (error) {
      const errorMessage = error.message || 'Aktivasyon kodu gönderilemedi. Lütfen tekrar deneyin.';
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Hata', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Aktivasyon kodu ile giriş
  const handleActivationLogin = async () => {
    if (!validateActivationCode()) {
      return;
    }

    setLoading(true);
    try {
      // Aktivasyon kodu doğrulandı - normal login yap
      let loginEmail = emailOrPhone;
      
      // Telefon numarası ile login - telefon numarasından email bul
      if (isPhone(emailOrPhone)) {
        const { getAllUsers } = await import('../../services/mock/mockUserStore');
        const allUsers = getAllUsers();
        const cleanedPhone = emailOrPhone.replace(/\s/g, '').replace(/[()-]/g, '');
        const foundUser = allUsers.find(u => {
          const userPhone = u.phone?.replace(/\s/g, '').replace(/[()-]/g, '');
          return userPhone === cleanedPhone;
        });
        if (foundUser) {
          loginEmail = foundUser.email;
        }
      }
      
      const response = await login(loginEmail, password);

      // Email'i AsyncStorage'a kaydet (token ile birlikte)
      try {
        const emailToSave = isEmail(emailOrPhone) ? emailOrPhone.toLowerCase().trim() : loginEmail.toLowerCase().trim();
        await AsyncStorage.setItem('userEmail', emailToSave);
      } catch (error) {
        console.warn('Email kaydetme hatası:', error);
      }

      // Token'ı AuthContext'e kaydet
      await authLogin(response.token);
      
      // Beni Hatırla - AsyncStorage'a kaydet
      if (rememberMe) {
        try {
          await AsyncStorage.setItem('rememberMe', 'true');
          await AsyncStorage.setItem('savedEmail', emailOrPhone);
        } catch (error) {
          console.error('Remember me kaydetme hatası:', error);
        }
      } else {
        try {
          await AsyncStorage.removeItem('rememberMe');
          await AsyncStorage.removeItem('savedEmail');
        } catch (error) {
          console.error('Remember me silme hatası:', error);
        }
      }
      
      // Beni Hatırla - AsyncStorage'a kaydet
      if (rememberMe) {
        try {
          await AsyncStorage.setItem('rememberMe', 'true');
          await AsyncStorage.setItem('savedEmail', emailOrPhone);
        } catch (error) {
          console.error('Remember me kaydetme hatası:', error);
        }
      } else {
        try {
          await AsyncStorage.removeItem('rememberMe');
          await AsyncStorage.removeItem('savedEmail');
        } catch (error) {
          console.error('Remember me silme hatası:', error);
        }
      }

      // Modal'ı kapat
      setShowActivationModal(false);
      setActivationCode('');

      // Home Screen'e yönlendir
      // Navigation otomatik olarak AppStack'e geçecek
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Giriş yapılamadı. Lütfen tekrar deneyin.');
      } else {
        Alert.alert('Hata', error.message || 'Giriş yapılamadı. Lütfen tekrar deneyin.');
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
          <Text style={styles.title}>Hoş Geldiniz</Text>
          <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>

          <Input
            label="Email veya Cep Telefonu"
            placeholder="ornek@email.com veya 05XX XXX XX XX"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            keyboardType="default"
            error={errors.emailOrPhone}
          />

          <Input
            label="Şifre"
            placeholder="Şifrenizi giriniz"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

          {/* Beni Hatırla */}
          <TouchableOpacity
            style={styles.rememberMeContainer}
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberMeText}>Beni hatırla</Text>
          </TouchableOpacity>

          <Button
            title="Giriş Yap"
            onPress={handleLogin}
            loading={loading}
          />

          <Button
            title="Şifremi Unuttum"
            onPress={() => navigation.navigate('ForgotPassword')}
            variant="secondary"
          />

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Hesabınız yok mu? </Text>
            <Text
              style={styles.signupLink}
              onPress={() => navigation.navigate('Signup')}
            >
              Kayıt Ol
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Aktivasyon Kodu Modal */}
      <Modal
        visible={showActivationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowActivationModal(false);
          setActivationCode('');
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowActivationModal(false);
          setActivationCode('');
        }}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Aktivasyon Kodu</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowActivationModal(false);
                      setActivationCode('');
                    }}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.modalDescription}>
                    {getLoginType() === 'email' 
                      ? `${emailOrPhone} adresine gönderilen aktivasyon kodunu giriniz.`
                      : `${emailOrPhone} numarasına gönderilen aktivasyon kodunu giriniz.`}
                  </Text>
                  <Input
                    label="Aktivasyon Kodu"
                    placeholder="6 haneli kod"
                    value={activationCode}
                    onChangeText={setActivationCode}
                    keyboardType="number-pad"
                    error={errors.activationCode}
                  />
                  <Button
                    title="Giriş Yap"
                    onPress={handleActivationLogin}
                    loading={loading}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setShowActivationModal(false);
                      setActivationCode('');
                    }}
                    style={styles.modalCancelButton}
                  >
                    <Text style={styles.modalCancelText}>İptal</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  signupText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: spacing.sm,
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
  rememberMeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    width: '100%',
    maxWidth: 400,
    ...shadows.large,
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
    padding: spacing.lg,
  },
  modalDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalCancelButton: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default LoginScreen;

