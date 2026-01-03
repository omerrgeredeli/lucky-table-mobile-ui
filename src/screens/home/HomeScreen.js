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

/**
 * Home Screen - Micro-Screen Architecture
 * Ana ekran modüler component'lerden oluşur
 * Her modül bağımsızdır ve kendi state'ini yönetir
 */
const HomeScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hoşgeldin Yazısı */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Hoşgeldin</Text>
        </View>

        {/* Sadakat Bilgileri */}
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
  welcomeText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
});

export default HomeScreen;

