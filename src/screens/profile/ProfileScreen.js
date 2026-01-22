import React, { useState, useEffect, useContext, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  getUserProfile,
  updateUserProfile,
  updatePassword,
  getNotificationSettings,
  updateNotificationSettings,
  deleteAccount,
} from '../../services/userService';
import { colors, spacing, typography, shadows } from '../../theme';
import Logo from '../../components/Logo';
import Button from '../../components/Button';
import Input from '../../components/Input';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { logout } = useContext(AuthContext);
  const { supportedLanguages, currentLanguage, changeLanguage, getCurrentLanguageInfo } = useLanguage();

  const [profileData, setProfileData] = useState({ email: '', phone: '' });
  const [originalProfileData, setOriginalProfileData] = useState({ email: '', phone: '' });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showCancelMembershipModal, setShowCancelMembershipModal] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);

  const passwordRules = useMemo(() => [
    { label: t('password.rules.minLength'), test: (p) => p.length >= 8 },
    { label: t('password.rules.uppercase'), test: (p) => /[A-Z]/.test(p) },
    { label: t('password.rules.lowercase'), test: (p) => /[a-z]/.test(p) },
    { label: t('password.rules.number'), test: (p) => /[0-9]/.test(p) },
    { label: t('password.rules.special'), test: (p) => /[^A-Za-z0-9]/.test(p) },
  ], [t]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await getUserProfile();
      const profile = { email: data.email || '', phone: data.phone || '' };
      setProfileData(profile);
      setOriginalProfileData(profile);
      const notif = await getNotificationSettings();
      setNotificationsEnabled(notif.notificationsEnabled !== false);
    } catch (e) {
      Alert.alert('Hata', 'Profil yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancelMembership = async () => {
    setShowCancelMembershipModal(false);
    setLoading(true);
    try {
      await deleteAccount();
      await AsyncStorage.setItem('redirectToSignup', 'true');
      await logout();
    } catch (e) {
      Alert.alert('Hata', 'Üyelik iptali başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Logo size="small" />

        {/* Üyelik İptali */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.dangerButton} onPress={() => setShowCancelMembershipModal(true)}>
            <Text style={styles.dangerButtonText}>{t('profile.cancelMembership')}</Text>
          </TouchableOpacity>
        </View>

        {/* ÜYELİK İPTAL MODAL */}
        <Modal transparent visible={showCancelMembershipModal} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('profile.cancelMembershipTitle')}</Text>
              <Text style={styles.modalDescription}>{t('profile.cancelMembershipConfirm')}</Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowCancelMembershipModal(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>{t('common.no')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleConfirmCancelMembership}
                >
                  <Text style={styles.modalButtonTextConfirm}>{t('common.yes')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  contentContainer: { padding: spacing.md },

  section: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.md,
    ...shadows.medium,
  },

  dangerButton: { alignItems: 'center', padding: spacing.md },
  dangerButtonText: { color: colors.error, fontSize: typography.fontSize.md },

  /* 🔥 ANDROID FIX BURASI */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '90%',
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.lg,

    // 🔥 KRİTİK
    zIndex: 1000,
    elevation: 20,
  },

  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.sm,

    zIndex: 1001,
    elevation: 21,
  },

  modalDescription: {
    fontSize: typography.fontSize.md,
    marginBottom: spacing.md,

    zIndex: 1001,
    elevation: 21,
  },

  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',

    zIndex: 1002,
    elevation: 22,
  },

  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: spacing.sm,
  },

  modalButtonCancel: {
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },

  modalButtonConfirm: {
    backgroundColor: colors.error,
  },

  modalButtonTextCancel: {
    color: colors.textPrimary,
    fontWeight: '600',

    zIndex: 1003,
    elevation: 23,
  },

  modalButtonTextConfirm: {
    color: colors.white,
    fontWeight: '600',

    zIndex: 1003,
    elevation: 23,
  },
});

export default ProfileScreen;
