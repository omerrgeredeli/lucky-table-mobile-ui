import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import { colors, spacing, typography, shadows } from '../../theme';
import Logo from '../../components/Logo';
import Button from '../../components/Button';

/**
 * Language Selection Screen - İlk açılışta zorunlu dil seçimi
 * Kullanıcı dil seçmeden uygulamaya devam edemez
 */
const LanguageSelectionScreen = () => {
  const { t } = useTranslation();
  const { supportedLanguages, saveLanguageSelection } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLanguageSelect = async (languageCode) => {
    setSelectedLanguage(languageCode);
  };

  const handleContinue = async () => {
    if (!selectedLanguage) {
      return;
    }

    setLoading(true);
    try {
      const success = await saveLanguageSelection(selectedLanguage);
      if (!success) {
        // Hata durumunda kullanıcıya bilgi verilebilir
        console.error('Dil seçimi kaydedilemedi');
      }
      // LanguageContext otomatik olarak isLanguageSelected'ı true yapacak
      // AppNavigator bunu algılayıp uygun ekrana yönlendirecek
    } catch (error) {
      console.error('Dil seçimi hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Geçici olarak seçili dil için çevirileri göster
  // Gerçek çeviri dil seçildikten sonra aktif olacak
  const getLanguageName = (code) => {
    const names = {
      tr: 'Türkçe',
      en: 'English',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
      ru: 'Русский',
    };
    return names[code] || code;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Logo size="large" />
        </View>

        {/* Başlık */}
        <Text style={styles.title}>
          {selectedLanguage === 'tr' || !selectedLanguage
            ? 'Dil Seçimi'
            : selectedLanguage === 'en'
            ? 'Language Selection'
            : selectedLanguage === 'fr'
            ? 'Sélection de la langue'
            : selectedLanguage === 'de'
            ? 'Sprachauswahl'
            : selectedLanguage === 'it'
            ? 'Selezione lingua'
            : 'Выбор языка'}
        </Text>

        {/* Alt başlık */}
        <Text style={styles.subtitle}>
          {selectedLanguage === 'tr' || !selectedLanguage
            ? 'Lütfen uygulama dilinizi seçin'
            : selectedLanguage === 'en'
            ? 'Please select your application language'
            : selectedLanguage === 'fr'
            ? 'Veuillez sélectionner la langue de l\'application'
            : selectedLanguage === 'de'
            ? 'Bitte wählen Sie Ihre Anwendungssprache'
            : selectedLanguage === 'it'
            ? 'Seleziona la lingua dell\'applicazione'
            : 'Пожалуйста, выберите язык приложения'}
        </Text>

        {/* Dil Listesi */}
        <View style={styles.languageList}>
          {supportedLanguages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                selectedLanguage === language.code && styles.languageItemSelected,
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              activeOpacity={0.7}
            >
              <View style={styles.languageContent}>
                <Text style={styles.languageFlag}>{language.flag}</Text>
                <Text
                  style={[
                    styles.languageName,
                    selectedLanguage === language.code && styles.languageNameSelected,
                  ]}
                >
                  {getLanguageName(language.code)}
                </Text>
              </View>
              {selectedLanguage === language.code && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Devam Butonu */}
      <View style={styles.buttonContainer}>
        <Button
          title={
            selectedLanguage === 'tr' || !selectedLanguage
              ? 'Devam Et'
              : selectedLanguage === 'en'
              ? 'Continue'
              : selectedLanguage === 'fr'
              ? 'Continuer'
              : selectedLanguage === 'de'
              ? 'Fortfahren'
              : selectedLanguage === 'it'
              ? 'Continua'
              : 'Продолжить'
          }
          onPress={handleContinue}
          disabled={!selectedLanguage || loading}
          loading={loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  languageList: {
    marginTop: spacing.md,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.small,
  },
  languageItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  languageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageFlag: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  languageName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  languageNameSelected: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  buttonContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default LanguageSelectionScreen;
