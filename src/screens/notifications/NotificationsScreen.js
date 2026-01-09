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
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import Logo from '../../components/Logo';

/**
 * Notifications Screen - Bildirimler
 * Favori Mekanlar → Tümünü Gör sayfası ile aynı layout yapısında
 */
const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  // Mock bildirim verileri
  const mockNotifications = [
    { id: 1, date: '12.09.2024', type: 'cafeVisited', cafeName: 'X Kafesi' },
    { id: 2, date: '08.09.2024', type: 'orderPlaced', cafeName: 'Y Cafe' },
    { id: 3, date: '05.09.2024', type: 'paymentMade', restaurantName: 'Z Restoran' },
    { id: 4, date: '03.09.2024', type: 'cafeVisited', cafeName: 'A Kafe' },
    { id: 5, date: '01.09.2024', type: 'orderPlaced', cafeName: 'B Cafe' },
    { id: 6, date: '28.08.2024', type: 'paymentMade', restaurantName: 'C Restoran' },
    { id: 7, date: '25.08.2024', type: 'cafeVisited', cafeName: 'D Kafe' },
    { id: 8, date: '22.08.2024', type: 'orderPlaced', cafeName: 'E Cafe' },
    { id: 9, date: '20.08.2024', type: 'paymentMade', restaurantName: 'F Restoran' },
    { id: 10, date: '18.08.2024', type: 'cafeVisited', cafeName: 'G Kafe' },
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
          <Text style={styles.sectionTitle}>{t('notifications.title')}</Text>
              <FlatList
                data={mockNotifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => {
                  let message = '';
                  if (item.type === 'cafeVisited') {
                    message = t('notifications.cafeVisited', { cafeName: item.cafeName });
                  } else if (item.type === 'orderPlaced') {
                    message = t('notifications.orderPlaced', { cafeName: item.cafeName });
                  } else if (item.type === 'paymentMade') {
                    message = t('notifications.paymentMade', { restaurantName: item.restaurantName });
                  }
                  return (
                    <View style={styles.notificationItem}>
                      <Text style={styles.notificationDate}>{item.date}</Text>
                      <Text style={styles.notificationMessage}>{message}</Text>
                    </View>
                  );
                }}
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

