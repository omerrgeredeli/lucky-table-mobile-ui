import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, shadows } from '../../theme';
import Logo from '../../components/Logo';
import LoyaltyList from './components/LoyaltyList';
import { getUserProfile } from '../../services/userService';

/**
 * Home Screen - Micro-Screen Architecture
 * Ana ekran modüler component'lerden oluşur
 * Her modül bağımsızdır ve kendi state'ini yönetir
 */
const HomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Profil bilgisi alınamadı:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayName = userProfile?.fullName || userProfile?.name || t('home.user');

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <Logo size="small" />

        {/* Hoşgeldin Yazısı ve Bildirim İkonu */}
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeRow}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={styles.welcomeText}>{t('home.welcome')} {displayName}</Text>
            )}
            <TouchableOpacity
              onPress={() => navigation.navigate('Notifications')}
              style={styles.notificationIcon}
            >
              <Text style={styles.notificationIconText}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Favori Mekanlar */}
        <LoyaltyList />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  welcomeContainer: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
  },
  welcomeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  notificationIcon: {
    padding: spacing.xs,
  },
  notificationIconText: {
    fontSize: 24,
  },
});

export default HomeScreen;

