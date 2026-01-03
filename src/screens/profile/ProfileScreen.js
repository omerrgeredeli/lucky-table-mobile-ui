import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AuthContext } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile } from '../../services/userService';
import { colors, spacing, typography, shadows } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';

/**
 * Profile Screen - Micro-Screen Architecture
 * Kullanıcı profil görüntüleme ve düzenleme
 * Bu ekran tamamen bağımsızdır, kendi state'ini yönetir
 */
const ProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { logout } = useContext(AuthContext);

  // Route'dan gelen mode parametresi (view veya edit)
  const initialMode = route.params?.mode || 'view';

  // Local state - sadece bu ekrana özel
  const [mode, setMode] = useState(initialMode); // 'view' veya 'edit'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState({});

  // Component mount olduğunda profil bilgilerini yükle
  useEffect(() => {
    loadProfile();
  }, []);

  // Profil bilgilerini yükle
  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile();
      setProfileData({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
      });
    } catch (error) {
      Alert.alert('Hata', error.message || 'Profil bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  // Form validasyonu
  const validateForm = () => {
    const newErrors = {};

    if (!profileData.name.trim()) {
      newErrors.name = 'İsim gereklidir';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Geçerli bir email adresi giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Profil güncelleme
  const handleUpdateProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile(profileData);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.', [
        {
          text: 'Tamam',
          onPress: () => setMode('view'),
        },
      ]);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Profil güncellenemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  // Çıkış yap
  const handleLogout = () => {
    Alert.alert('Çıkış Yap', 'Çıkış yapmak istediğinize emin misiniz?', [
      {
        text: 'İptal',
        style: 'cancel',
      },
      {
        text: 'Çıkış Yap',
        style: 'destructive',
        onPress: async () => {
          await logout();
          // Navigation otomatik olarak AuthStack'e geçecek
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profil Bilgileri</Text>
        {mode === 'view' && (
          <TouchableOpacity onPress={() => setMode('edit')}>
            <Text style={styles.editButton}>Düzenle</Text>
          </TouchableOpacity>
        )}
        {mode === 'edit' && (
          <TouchableOpacity onPress={() => setMode('view')}>
            <Text style={styles.cancelButton}>İptal</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.form}>
        <Input
          label="İsim"
          placeholder="Adınız ve soyadınız"
          value={profileData.name}
          onChangeText={(text) => setProfileData({ ...profileData, name: text })}
          editable={mode === 'edit'}
          error={errors.name}
        />

        <Input
          label="Email"
          placeholder="ornek@email.com"
          value={profileData.email}
          onChangeText={(text) => setProfileData({ ...profileData, email: text })}
          keyboardType="email-address"
          editable={mode === 'edit'}
          error={errors.email}
        />

        <Input
          label="Telefon"
          placeholder="05XX XXX XX XX"
          value={profileData.phone}
          onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
          keyboardType="phone-pad"
          editable={mode === 'edit'}
          error={errors.phone}
        />

        <Input
          label="Adres"
          placeholder="Adres bilginiz"
          value={profileData.address}
          onChangeText={(text) => setProfileData({ ...profileData, address: text })}
          editable={mode === 'edit'}
          multiline
          numberOfLines={3}
          error={errors.address}
        />

        {mode === 'edit' && (
          <Button
            title="Kaydet"
            onPress={handleUpdateProfile}
            loading={saving}
          />
        )}
      </View>

      <View style={styles.logoutSection}>
        <Button
          title="Çıkış Yap"
          onPress={handleLogout}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm + 4, // 12
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  editButton: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  cancelButton: {
    fontSize: typography.fontSize.md,
    color: colors.error,
    fontWeight: typography.fontWeight.semibold,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md - 4, // 12
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  logoutSection: {
    marginTop: spacing.sm,
  },
});

export default ProfileScreen;

