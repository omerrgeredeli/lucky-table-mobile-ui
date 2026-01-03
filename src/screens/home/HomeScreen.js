import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography, shadows } from '../../theme';
import LoyaltyList from './components/LoyaltyList';
import CafeSearch from './components/CafeSearch';
import NearbyCafesMap from './components/NearbyCafesMap';

/**
 * Home Screen - Micro-Screen Architecture
 * Ana ekran modüler component'lerden oluşur
 * Her modül bağımsızdır ve kendi state'ini yönetir
 */
const HomeScreen = () => {
  const navigation = useNavigation();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* A. Kullanıcı Sipariş & Sadakat Bilgileri */}
      <LoyaltyList />

      {/* B. Kafe Arama */}
      <CafeSearch />

      {/* C. Yakındaki Kafeler (Harita) */}
      <NearbyCafesMap />

      {/* D. Profil İşlemleri */}
      <View style={styles.profileSection}>
        <Text style={styles.sectionTitle}>Profil İşlemleri</Text>
        <View style={styles.profileButtons}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile', { mode: 'view' })}
          >
            <Text style={styles.profileButtonText}>Profil Görüntüle</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.profileButton, styles.profileButtonSecondary]}
            onPress={() => navigation.navigate('Profile', { mode: 'edit' })}
          >
            <Text style={[styles.profileButtonText, styles.profileButtonTextSecondary]}>
              Profil Düzenle
            </Text>
          </TouchableOpacity>
        </View>
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
  profileSection: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md - 4, // 12
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm + 4, // 12
  },
  profileButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 4, // 12
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  profileButtonSecondary: {
    backgroundColor: colors.transparent,
    borderWidth: 1,
    borderColor: colors.primary,
    marginRight: 0,
    marginLeft: spacing.sm,
  },
  profileButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  profileButtonTextSecondary: {
    color: colors.primary,
  },
});

export default HomeScreen;

