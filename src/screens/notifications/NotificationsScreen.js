import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, typography } from '../../theme';
import Logo from '../../components/Logo';

/**
 * Notifications Screen - Bildirimler
 * Favori Mekanlar → Tümünü Gör sayfası ile aynı layout yapısında
 */
const NotificationsScreen = () => {
  const navigation = useNavigation();

  // Mock bildirim verileri
  const mockNotifications = [
    { id: 1, date: '12.09.2024', message: 'X Kafesi\'ne gittiniz' },
    { id: 2, date: '08.09.2024', message: 'Y Cafe\'de sipariş verdiniz' },
    { id: 3, date: '05.09.2024', message: 'Z Restoran\'da ödeme yaptınız' },
    { id: 4, date: '03.09.2024', message: 'A Kafe\'ye gittiniz' },
    { id: 5, date: '01.09.2024', message: 'B Cafe\'de sipariş verdiniz' },
    { id: 6, date: '28.08.2024', message: 'C Restoran\'da ödeme yaptınız' },
    { id: 7, date: '25.08.2024', message: 'D Kafe\'ye gittiniz' },
    { id: 8, date: '22.08.2024', message: 'E Cafe\'de sipariş verdiniz' },
    { id: 9, date: '20.08.2024', message: 'F Restoran\'da ödeme yaptınız' },
    { id: 10, date: '18.08.2024', message: 'G Kafe\'ye gittiniz' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo - En üstte */}
        <View style={styles.logoContainer}>
          <Logo size="small" />
        </View>

        {/* Geri Butonu */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        {/* Bildirimler Listesi */}
        <View style={styles.notificationsContainer}>
          <Text style={styles.sectionTitle}>Bildirimler</Text>
          <FlatList
            data={mockNotifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.notificationItem}>
                <Text style={styles.notificationDate}>{item.date}</Text>
                <Text style={styles.notificationMessage}>{item.message}</Text>
              </View>
            )}
            scrollEnabled={false}
          />
        </View>
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
  scrollContent: {
    padding: spacing.md,
  },
  logoContainer: {
    paddingBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
  },
  notificationsContainer: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  notificationItem: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
  },
  notificationDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  notificationMessage: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
  },
});

export default NotificationsScreen;

