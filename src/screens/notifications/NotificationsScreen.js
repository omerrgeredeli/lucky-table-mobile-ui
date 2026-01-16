import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '../../theme';
import Logo from '../../components/Logo';
import { getRecentActivities } from '../../services/activityService';

/**
 * Notifications Screen - Bildirimler
 * Activity table'dan son 10 order'ı çeker ve gösterir
 * Favori Mekanlar → Tümünü Gör sayfası ile aynı layout yapısında
 */
const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const activities = await getRecentActivities();
      setNotifications(activities || []);
    } catch (error) {
      console.error('Notifications fetch error:', error);
      Alert.alert(t('common.error'), t('notifications.loadError') || 'Bildirimler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch (error) {
      return dateString;
    }
  };

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
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('notifications.noNotifications')}</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
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
                    <Text style={styles.notificationDate}>{formatDate(item.date)}</Text>
                    <Text style={styles.notificationMessage}>{message}</Text>
                  </View>
                );
              }}
              scrollEnabled={false}
            />
          )}
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
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
});

export default NotificationsScreen;

