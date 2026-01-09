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
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { AuthContext } from '../../context/AuthContext';
import { login, sendActivationCode } from '../../services/authService';
import { GOOGLE_CLIENT_IDS, GOOGLE_CLIENT_SECRET } from '../../config/googleAuth';
import { colors, spacing, typography, shadows } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';
import PasswordInput from '../../components/PasswordInput';
import Logo from '../../components/Logo';

// WebBrowser için gerekli
WebBrowser.maybeCompleteAuthSession();

/**
 * Login Screen - Micro-Screen Architecture
 * Bu ekran tamamen bağımsızdır, kendi state'ini yönetir
 */
const LoginScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
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
    loadRememberedCredentials();
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

  // Kaydedilen email ve şifreyi yükle
  const loadRememberedCredentials = async () => {
    try {
      const remembered = await AsyncStorage.getItem('rememberMe');
      if (remembered === 'true') {
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        const savedPassword = await AsyncStorage.getItem('savedPassword');
        
        if (savedEmail) {
          setEmailOrPhone(savedEmail);
        }
        if (savedPassword) {
          setPassword(savedPassword);
        }
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Remember me yükleme hatası:', error);
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
        await sendActivationCode(emailOrPhone);
        setShowActivationModal(true);
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
      await sendActivationCode(emailOrPhone);
      
      // Aktivasyon kodu modal'ını aç
      setShowActivationModal(true);
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

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Config'den platforma göre client ID ve secret al
      const clientId = Platform.OS === 'web' 
        ? GOOGLE_CLIENT_IDS.web
        : Platform.OS === 'ios' 
          ? GOOGLE_CLIENT_IDS.ios
          : GOOGLE_CLIENT_IDS.android;
      const clientSecret = Platform.OS === 'web' ? GOOGLE_CLIENT_SECRET.web : null;

      // Google OAuth configuration
      const discovery = {
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
      };

      // Redirect URI - platforma göre ayarla
      // Web için doğrudan localhost:19006 kullan
      // Mobile için useProxy: true kullan (Expo proxy)
      let redirectUri;
      if (Platform.OS === 'web') {
        // Web için localhost:19006 kullan (Google Cloud Console'da bu URI kayıtlı olmalı)
        redirectUri = typeof window !== 'undefined' 
          ? `${window.location.origin}${window.location.pathname}`
          : 'http://localhost:19006';
      } else {
        redirectUri = AuthSession.makeRedirectUri({
          useProxy: true,
          scheme: 'com.luckytable.app',
        });
      }
      
      // Debug: Redirect URI'yi console'a yazdır
      console.log('Platform:', Platform.OS);
      console.log('Redirect URI:', redirectUri);
      console.log('Client ID:', clientId);

      // Authorization Code Flow kullan (Google artık implicit flow desteklemiyor)
      // Web için PKCE devre dışı (client_secret kullanılacak)
      // Mobile için PKCE aktif
      const request = new AuthSession.AuthRequest({
        clientId: clientId,
        scopes: ['openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code, // Token yerine Code kullan
        redirectUri: redirectUri,
        usePKCE: Platform.OS !== 'web', // Web için PKCE devre dışı, mobile için aktif
      });

      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        // Authorization code alındı, token'a exchange et
        const { code } = result.params;
        
        // PKCE code verifier'ı request'ten al (sadece mobile için)
        const codeVerifier = request.codeVerifier;
        
        // Debug: code_verifier kontrolü
        console.log('Code verifier:', codeVerifier ? 'Found' : 'Not found');
        console.log('Client secret:', clientSecret ? 'Found' : 'Not found');
        
        // Token exchange
        // Web için client_secret kullan, mobile için PKCE kullan
        const tokenBody = {
          client_id: clientId,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        };
        
        // Web için client_secret ekle (PKCE olmadan)
        if (clientSecret) {
          tokenBody.client_secret = clientSecret;
        }
        
        // Mobile için PKCE code_verifier ekle (client_secret olmadan)
        if (codeVerifier && !clientSecret) {
          tokenBody.code_verifier = codeVerifier;
        }
        
        const tokenResponse = await fetch(discovery.tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(tokenBody).toString(),
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error_description: errorText };
          }
          throw new Error(errorData.error_description || errorData.error || 'Token exchange failed');
        }

        const tokenData = await tokenResponse.json();
        const { access_token } = tokenData;

        // Google user info al
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const userInfo = await userInfoResponse.json();

        // Mock user oluştur veya mevcut kullanıcıyı bul
        const { USE_MOCK_API } = await import('../../config/api');
        if (USE_MOCK_API) {
          const { getAllUsers, addUser } = await import('../../services/mock/mockUserStore');
          const allUsers = getAllUsers();
          
          // Google email ile kullanıcı var mı kontrol et
          let foundUser = allUsers.find(u => u.email.toLowerCase() === userInfo.email.toLowerCase());
          
          if (!foundUser) {
            // Yeni mock user oluştur
            const newUser = {
              id: Date.now(),
              email: userInfo.email.toLowerCase(),
              password: 'google_signin', // Google sign-in için özel password
              name: userInfo.name || userInfo.email.split('@')[0],
              fullName: userInfo.name || userInfo.email.split('@')[0],
              phone: '',
              countryCode: 'TR',
              phoneNumber: '',
              notificationsEnabled: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await addUser(newUser);
            foundUser = newUser;
          }

          // Token oluştur
          const token = `mock_jwt_token_${Date.now()}_${foundUser.id}_${foundUser.email.replace('@', '_at_')}`;
          
          // Token'ı kaydet
          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('userEmail', foundUser.email);

          // AuthContext'e kaydet
          await authLogin(token);
        } else {
          // Real API modunda - backend'e Google token gönder
          // Şimdilik mock user oluştur
          const token = `mock_jwt_token_${Date.now()}_google_${userInfo.email.replace('@', '_at_')}`;
          await AsyncStorage.setItem('userToken', token);
          await AsyncStorage.setItem('userEmail', userInfo.email);
          await authLogin(token);
        }
      } else if (result.type === 'error') {
        throw new Error(result.error?.message || 'Google girişi başarısız');
      } else {
        // User cancelled
        setLoading(false);
        return;
      }
    } catch (error) {
      if (Platform.OS === 'web') {
        window.alert('Hata: ' + (error.message || 'Google girişi başarısız. Lütfen tekrar deneyin.'));
      } else {
        Alert.alert('Hata', error.message || 'Google girişi başarısız. Lütfen tekrar deneyin.');
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
      
      // Beni Hatırla - AsyncStorage'a kaydet (email ve şifre)
      if (rememberMe) {
        try {
          await AsyncStorage.setItem('rememberMe', 'true');
          await AsyncStorage.setItem('savedEmail', emailOrPhone);
          await AsyncStorage.setItem('savedPassword', password);
        } catch (error) {
          console.error('Remember me kaydetme hatası:', error);
        }
      } else {
        try {
          await AsyncStorage.removeItem('rememberMe');
          await AsyncStorage.removeItem('savedEmail');
          await AsyncStorage.removeItem('savedPassword');
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
          <Text style={styles.title}>{t('auth.welcome')}</Text>
          <Text style={styles.subtitle}>{t('auth.loginSubtitle')}</Text>

          <Input
            label={t('auth.emailOrPhone')}
            placeholder={t('auth.emailOrPhonePlaceholder')}
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            keyboardType="default"
            error={errors.emailOrPhone}
          />

          <PasswordInput
            label={t('auth.password')}
            placeholder={t('auth.passwordPlaceholder')}
            value={password}
            onChangeText={setPassword}
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
            <Text style={styles.rememberMeText}>{t('auth.rememberMe')}</Text>
          </TouchableOpacity>

          <Button
            title={t('auth.login')}
            onPress={handleLogin}
            loading={loading}
          />

          {/* Butonlar arası spacing */}
          <View style={styles.buttonSpacing} />

          <Button
            title={t('auth.loginWithGoogle')}
            onPress={handleGoogleSignIn}
            variant="google"
            loading={loading}
          />

          {/* Butonlar arası spacing */}
          <View style={styles.buttonSpacing} />

          <Button
            title={t('auth.forgotPassword')}
            onPress={() => navigation.navigate('ForgotPassword')}
            variant="secondary"
          />

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>{t('auth.dontHaveAccount')} </Text>
            <Text
              style={styles.signupLink}
              onPress={() => navigation.navigate('Signup')}
            >
              {t('auth.signup')}
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
                  <Text style={styles.modalTitle}>{t('auth.activationCode')}</Text>
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
                      ? t('auth.activationCodeDescription') + ` ${emailOrPhone}`
                      : t('auth.activationCodeDescription') + ` ${emailOrPhone}`}
                  </Text>
                  <Input
                    label={t('auth.activationCode')}
                    placeholder={t('auth.activationCodePlaceholder')}
                    value={activationCode}
                    onChangeText={setActivationCode}
                    keyboardType="number-pad"
                    error={errors.activationCode}
                  />
                  <Button
                    title={t('auth.login')}
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
                    <Text style={styles.modalCancelText}>{t('common.cancel')}</Text>
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
  buttonSpacing: {
    height: spacing.md,
  },
});

export default LoginScreen;

