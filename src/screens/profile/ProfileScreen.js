import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  updateEmail,
  updatePhone,
  getNotificationSettings,
  updateNotificationSettings,
  deleteAccount,
} from '../../services/userService';
import { colors, spacing, typography, shadows } from '../../theme';
import Button from '../../components/Button';
import Input from '../../components/Input';

/**
 * Profile Screen - Profil Yönetimi
 * Üyelik Bilgileri, Bildirimler, Üyelik İptali, Çıkış Yap
 */
const ProfileScreen = () => {
  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);

  // State
  const [profileData, setProfileData] = useState({
    email: '',
    phone: '',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalProfileData, setOriginalProfileData] = useState({
    email: '',
    phone: '',
  });

  // Modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);

  // Edit states
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activationCode, setActivationCode] = useState('');

  // Şifre validasyon kuralları
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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile();
      const profile = {
        email: data.email || '',
        phone: data.phone || '',
      };
      setProfileData(profile);
      setOriginalProfileData(profile);
      setHasChanges(false);
      
      // Bildirim ayarlarını yükle
      const notificationSettings = await getNotificationSettings();
      setNotificationsEnabled(notificationSettings.notificationsEnabled !== false);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Profil bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  // Email düzenleme
  const handleEmailEdit = () => {
    setNewEmail(profileData.email);
    setShowEmailModal(true);
  };

  const handleEmailUpdate = async () => {
    if (!newEmail.trim() || !/\S+@\S+\.\S+/.test(newEmail)) {
      Alert.alert('Hata', 'Geçerli bir email adresi giriniz');
      return;
    }
    
    // Aktivasyon kodu gönder
    try {
      const { sendActivationCode } = await import('../../services/authService');
      await sendActivationCode(newEmail);
      setShowEmailModal(false);
      setShowActivationModal(true);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Aktivasyon kodu gönderilemedi');
    }
  };

  // Telefon düzenleme
  const handlePhoneEdit = () => {
    setNewPhone(profileData.phone);
    setShowPhoneModal(true);
  };

  const handlePhoneUpdate = async () => {
    const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
    const cleanedPhone = newPhone.replace(/\s/g, '').replace(/[()-]/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      Alert.alert('Hata', 'Geçerli bir telefon numarası giriniz');
      return;
    }
    
    // Aktivasyon kodu gönder
    try {
      const { sendActivationCode } = await import('../../services/authService');
      await sendActivationCode(cleanedPhone);
      setShowPhoneModal(false);
      setShowActivationModal(true);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Aktivasyon kodu gönderilemedi');
    }
  };

  // Şifre değişikliği
  const handlePasswordEdit = () => {
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  // Aktivasyon kodu doğrulama
  const handleActivationSubmit = async () => {
    if (activationCode.length !== 6) {
      Alert.alert('Hata', 'Aktivasyon kodu 6 haneli olmalıdır');
      return;
    }
    
    setLoading(true);
    try {
      // Email veya telefon güncelleme
      if (newEmail && newEmail !== profileData.email) {
        await updateEmail(newEmail, activationCode);
        setProfileData({ ...profileData, email: newEmail });
      } else if (newPhone) {
        await updatePhone(newPhone, activationCode);
        setProfileData({ ...profileData, phone: newPhone });
      }
      
      setShowActivationModal(false);
      setActivationCode('');
      setNewEmail('');
      setNewPhone('');
      Alert.alert('Başarılı', 'Bilgileriniz güncellendi');
      setHasChanges(false);
      await loadProfile();
    } catch (error) {
      Alert.alert('Hata', error.message || 'Güncelleme başarısız');
    } finally {
      setLoading(false);
    }
  };

  // Üyelik iptali modal state
  const [showCancelMembershipModal, setShowCancelMembershipModal] = useState(false);

  // Üyelik iptali
  const handleCancelMembership = () => {
    setShowCancelMembershipModal(true);
  };

  const handleConfirmCancelMembership = async () => {
    setShowCancelMembershipModal(false);
    setLoading(true);
    try {
      // Backend'e üyelik iptali isteği
      await deleteAccount();
      
      // Signup screen'e yönlendirme için flag kaydet
      await AsyncStorage.setItem('redirectToSignup', 'true');
      await logout();
      
      Alert.alert('Başarılı', 'Üyeliğiniz başarılı bir şekilde iptal edildi', [
        {
          text: 'Tamam',
          onPress: () => {
            // AppNavigator otomatik olarak AuthStack'e geçecek
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Üyelik iptali başarısız');
    } finally {
      setLoading(false);
    }
  };

  // Çıkış yap
  const handleLogout = async () => {
    await logout();
    // AppNavigator otomatik olarak AuthStack'e geçecek
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Üyelik Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Üyelik Bilgileri</Text>

          {/* Email */}
          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>E-posta</Text>
              <Text style={styles.infoValue}>{profileData.email}</Text>
            </View>
            <TouchableOpacity onPress={handleEmailEdit} style={styles.editIcon}>
              <Text style={styles.editIconText}>✏️</Text>
            </TouchableOpacity>
          </View>

          {/* Telefon */}
          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Cep Telefonu</Text>
              <Text style={styles.infoValue}>{profileData.phone}</Text>
            </View>
            <TouchableOpacity onPress={handlePhoneEdit} style={styles.editIcon}>
              <Text style={styles.editIconText}>✏️</Text>
            </TouchableOpacity>
          </View>

          {/* Şifre */}
          <View style={styles.infoRow}>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Şifre</Text>
              <Text style={styles.infoValue}>••••••••</Text>
            </View>
            <TouchableOpacity onPress={handlePasswordEdit} style={styles.editIcon}>
              <Text style={styles.editIconText}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bildirimler */}
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.sectionTitle}>Bildirimler</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={async (value) => {
                setNotificationsEnabled(value);
                setHasChanges(true);
                // Otomatik kaydet
                try {
                  await updateNotificationSettings(value);
                } catch (error) {
                  Alert.alert('Hata', error.message || 'Bildirim ayarları güncellenemedi');
                  setNotificationsEnabled(!value); // Geri al
                }
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </View>

        {/* Üyelik İptali */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleCancelMembership}
          >
            <Text style={styles.dangerButtonText}>Üyeliğimi İptal Et</Text>
          </TouchableOpacity>
        </View>

        {/* Üyelik İptali Modal */}
        <Modal
          visible={showCancelMembershipModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCancelMembershipModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Üyelik İptali</Text>
                <TouchableOpacity onPress={() => setShowCancelMembershipModal(false)}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalDescription}>
                  Üyeliğinizi iptal etmek istediğinize emin misiniz?
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowCancelMembershipModal(false)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Hayır</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handleConfirmCancelMembership}
                  >
                    <Text style={styles.modalButtonTextConfirm}>Evet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Çıkış Yap */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>

        {/* Kaydet Butonu - Değişiklikler varsa göster */}
        {hasChanges && (
          <View style={styles.saveContainer}>
            <Button
              title="Kaydet"
              onPress={async () => {
                setLoading(true);
                try {
                  await updateUserProfile(profileData);
                  setOriginalProfileData({ ...profileData });
                  setHasChanges(false);
                  Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi');
                  await loadProfile();
                } catch (error) {
                  Alert.alert('Hata', error.message || 'Profil güncellenemedi');
                } finally {
                  setLoading(false);
                }
              }}
              loading={loading}
            />
          </View>
        )}
      </ScrollView>

      {/* Email Düzenleme Modal */}
      <Modal
        visible={showEmailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>E-posta Düzenle</Text>
              <TouchableOpacity onPress={() => setShowEmailModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Input
                label="Yeni E-posta"
                placeholder="ornek@email.com"
                value={newEmail}
                onChangeText={setNewEmail}
                keyboardType="email-address"
              />
              <Button
                title="Güncelle"
                onPress={handleEmailUpdate}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Telefon Düzenleme Modal */}
      <Modal
        visible={showPhoneModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPhoneModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Telefon Düzenle</Text>
              <TouchableOpacity onPress={() => setShowPhoneModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Input
                label="Yeni Telefon"
                placeholder="05XX XXX XX XX"
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
              />
              <Button
                title="Güncelle"
                onPress={handlePhoneUpdate}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Şifre Değişikliği Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Şifre Değiştir</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Input
                label="Yeni Şifre"
                placeholder="Yeni şifrenizi giriniz"
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Input
                label="Şifre Tekrar"
                placeholder="Şifrenizi tekrar giriniz"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              
              {/* Şifre Validasyon Kuralları */}
              {newPassword.length > 0 && (
                <View style={styles.passwordRulesContainer}>
                  {passwordRules.map((rule, index) => {
                    const isValid = rule.test(newPassword);
                    return (
                      <Text
                        key={index}
                        style={[
                          styles.passwordRule,
                          isValid ? styles.passwordRuleValid : styles.passwordRuleInvalid,
                        ]}
                      >
                        {isValid ? '✓' : '✗'} {rule.label}
                      </Text>
                    );
                  })}
                </View>
              )}

              <Button
                title="Güncelle"
                onPress={async () => {
                  // Şifre validasyonu
                  const passwordErrors = passwordRules.filter((rule) => !rule.test(newPassword));
                  if (passwordErrors.length > 0) {
                    Alert.alert('Hata', 'Lütfen tüm şifre kurallarını sağlayın');
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    Alert.alert('Hata', 'Şifreler eşleşmiyor');
                    return;
                  }
                  
                  setLoading(true);
                  try {
                    // Eski şifre kontrolü için token'dan kullanıcı bilgisi alınmalı
                    // Mock'ta direkt güncelleme yapıyoruz
                    await updatePassword('', newPassword); // Mock'ta eski şifre kontrolü yok
                    setShowPasswordModal(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    Alert.alert('Başarılı', 'Şifreniz güncellendi');
                  } catch (error) {
                    Alert.alert('Hata', error.message || 'Şifre güncelleme başarısız');
                  } finally {
                    setLoading(false);
                  }
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aktivasyon Kodu</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowActivationModal(false);
                  setActivationCode('');
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalDescription}>
                Gönderilen aktivasyon kodunu giriniz
              </Text>
              <Input
                label="Aktivasyon Kodu"
                placeholder="6 haneli kod"
                value={activationCode}
                onChangeText={setActivationCode}
                keyboardType="number-pad"
                maxLength={6}
              />
              <Button
                title="Doğrula"
                onPress={handleActivationSubmit}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingVertical: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md - 4,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  editIcon: {
    padding: spacing.xs,
  },
  editIconText: {
    fontSize: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dangerButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.error,
    fontWeight: typography.fontWeight.semibold,
  },
  logoutButton: {
    padding: spacing.md,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  saveContainer: {
    marginTop: spacing.md,
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
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  passwordRulesContainer: {
    marginVertical: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
  },
  passwordRule: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.xs,
  },
  passwordRuleValid: {
    color: colors.success || '#2ECC71',
  },
  passwordRuleInvalid: {
    color: colors.error,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.error,
  },
  modalButtonTextCancel: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  modalButtonTextConfirm: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default ProfileScreen;
