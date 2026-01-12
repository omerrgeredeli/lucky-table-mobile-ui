import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, typography, shadows } from '../../theme';
import Logo from '../../components/Logo';
import Button from '../../components/Button';

/**
 * Business Profile Screen
 * İşletme kullanıcıları için profil ekranı
 * - Dil seçenekleri
 * - Çıkış Yap
 */
const BusinessProfileScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { logout } = useContext(AuthContext);
  const { supportedLanguages, currentLanguage, changeLanguage, getCurrentLanguageInfo } = useLanguage();
  
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  
  useEffect(() => {
    setSelectedLanguage(currentLanguage);
  }, [currentLanguage]);
  
  const handleLanguageChange = async () => {
    if (selectedLanguage !== currentLanguage) {
      await changeLanguage(selectedLanguage);
    }
    setShowLanguageModal(false);
  };
  
  // Çıkış yap - Customer profile ile aynı mantık
  const handleLogout = async () => {
    await logout();
    // AppNavigator otomatik olarak AuthStack'e geçecek
  };
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Logo size="small" />
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Dil Ayarları - Customer profile ile aynı */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.languageRow}
            onPress={() => {
              setSelectedLanguage(currentLanguage);
              setShowLanguageModal(true);
            }}
          >
            <View style={styles.languageContent}>
              <Text style={styles.sectionTitle}>{t('language.changeLanguage')}</Text>
              <Text style={styles.languageValue}>
                {getCurrentLanguageInfo().flag} {getCurrentLanguageInfo().name}
              </Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Çıkış Yap - Customer profile ile aynı */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Dil Seçimi Modal - Customer profile ile aynı */}
      <Modal
        visible={showLanguageModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowLanguageModal(false);
          setSelectedLanguage(currentLanguage);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('language.selectLanguage')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowLanguageModal(false);
                  setSelectedLanguage(currentLanguage);
                }}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {supportedLanguages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    selectedLanguage === language.code && styles.languageOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedLanguage(language.code);
                  }}
                >
                  <View style={styles.languageOptionContent}>
                    <Text style={styles.languageOptionFlag}>{language.flag}</Text>
                    <Text
                      style={[
                        styles.languageOptionText,
                        selectedLanguage === language.code && styles.languageOptionTextSelected,
                      ]}
                    >
                      {language.name}
                    </Text>
                  </View>
                  {selectedLanguage === language.code && (
                    <Text style={styles.languageOptionCheck}>✓</Text>
                  )}
                  </TouchableOpacity>
                ))}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowLanguageModal(false);
                  setSelectedLanguage(currentLanguage);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleLanguageChange}
              >
                <Text style={styles.modalButtonTextConfirm}>{t('common.save')}</Text>
              </TouchableOpacity>
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
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  languageContent: {
    flex: 1,
  },
  languageValue: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  arrow: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  logoutButton: {
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.error || '#FF3B30',
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: spacing.md,
    borderTopRightRadius: spacing.md,
    maxHeight: '80%',
    ...shadows.xlarge,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  modalCloseText: {
    fontSize: typography.fontSize.xl,
    color: colors.textSecondary,
  },
  modalBody: {
    padding: spacing.md,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageOptionFlag: {
    fontSize: typography.fontSize.lg,
    marginRight: spacing.sm,
  },
  languageOptionText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
  languageOptionTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  languageOptionCheck: {
    fontSize: typography.fontSize.md,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  modalButtonTextConfirm: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default BusinessProfileScreen;

