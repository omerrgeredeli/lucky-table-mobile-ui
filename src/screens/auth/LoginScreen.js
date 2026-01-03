import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { login } from '../../services/authService';
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form validasyonu
  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir email adresi giriniz';
    }

    if (!password.trim()) {
      newErrors.password = 'Şifre gereklidir';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Login işlemi
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Backend API çağrısı
      const response = await login(email, password);

      // Token'ı AuthContext'e kaydet
      await authLogin(response.token);

      // Home Screen'e yönlendir
      // Navigation otomatik olarak AppStack'e geçecek
    } catch (error) {
      Alert.alert('Hata', error.message || 'Giriş yapılamadı. Lütfen tekrar deneyin.');
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
            label="Email"
            placeholder="ornek@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={errors.email}
          />

          <Input
            label="Şifre"
            placeholder="Şifrenizi giriniz"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
          />

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
});

export default LoginScreen;

