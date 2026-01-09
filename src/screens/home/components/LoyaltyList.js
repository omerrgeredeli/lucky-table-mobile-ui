import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getUserLoyaltyInfo } from '../../../services/userService';
import { colors, spacing, typography, shadows } from '../../../theme';

/**
 * LoyaltyList Component - Micro-Screen Architecture
 * Kullanıcının sipariş ve sadakat bilgilerini gösterir
 * Bu component tamamen bağımsızdır, kendi state'ini yönetir
 */
const LoyaltyList = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [loyaltyData, setLoyaltyData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Component mount olduğunda veriyi çek
  useEffect(() => {
    fetchLoyaltyInfo();
  }, []);

  // API çağrısı - sadece bu component'e özel
  const fetchLoyaltyInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserLoyaltyInfo();
      setLoyaltyData(data || []);
    } catch (err) {
      setError(err.message);
      Alert.alert(t('common.error'), t('loyalty.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // İlk 3 kafeyi göster
  const displayedCafes = loyaltyData.slice(0, 3);

  // Kafe item render
  const renderCafeItem = ({ item }) => {
    const freeProductAt = item.freeProductAt || 10; // Varsayılan değer
    const progress = item.orderCount % freeProductAt;
    const nextFreeAt = freeProductAt - progress;

    return (
      <View style={styles.cafeItem}>
        <View style={styles.cafeHeader}>
          {item.cafeLogo ? (
            <Image
              source={{ uri: item.cafeLogo }}
              style={styles.cafeLogo}
              // defaultSource removed for web compatibility
              onError={() => {
                // Logo yüklenemezse fallback göster
              }}
            />
          ) : (
            <View style={[styles.cafeLogo, styles.cafeLogoPlaceholder]}>
              <Text style={styles.cafeLogoPlaceholderText}>
                {(item.cafeName || 'Kafe')[0].toUpperCase()}
              </Text>
            </View>
          )}
        <Text style={styles.cafeName}>{item.cafeName || t('loyalty.cafeName')}</Text>
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>
            {t('loyalty.totalOrders')}: <Text style={styles.statValue}>{item.orderCount || 0}</Text>
          </Text>
          <Text style={styles.statText}>
            {t('loyalty.freeProductAt')}: <Text style={styles.statValue}>{item.freeProductAt || 10}</Text> {t('loyalty.freeProductAtOrder')}
          </Text>
          <Text style={styles.progressText}>
            {t('loyalty.nextFreeProduct')}: <Text style={styles.progressValue}>{nextFreeAt}</Text> {t('loyalty.ordersLeft')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('loyalty.favoritePlaces')}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('LoyaltyDetails')}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>{t('loyalty.viewAll')} →</Text>
        </TouchableOpacity>
      </View>

      {/* En Çok Tercih Edilen 3 Mekan Başlığı */}
      {displayedCafes.length > 0 && (
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{t('loyalty.top3Places')}</Text>
        </View>
      )}

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>{t('loyalty.loading')}</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : displayedCafes.length === 0 ? (
          <Text style={styles.emptyText}>{t('loyalty.noOrderHistory')}</Text>
        ) : (
          <FlatList
            data={displayedCafes}
            renderItem={renderCafeItem}
            keyExtractor={(item, index) => `cafe-${index}`}
            scrollEnabled={false}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md - 4, // 12
    marginBottom: spacing.md,
    ...shadows.medium,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  headerText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  viewAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewAllText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    padding: spacing.md,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg - 4, // 20
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
    padding: spacing.lg - 4, // 20
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg - 4, // 20
  },
  cafeItem: {
    padding: spacing.sm + 4, // 12
    marginBottom: spacing.sm + 4, // 12
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  cafeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cafeLogo: {
    width: 40,
    height: 40,
    borderRadius: spacing.xs,
    marginRight: spacing.sm,
  },
  cafeLogoPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cafeLogoPlaceholderText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  cafeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  statsContainer: {
    marginTop: spacing.xs,
  },
  statText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginTop: spacing.sm,
    fontWeight: typography.fontWeight.medium,
  },
  progressValue: {
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  sectionTitleContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
});

export default LoyaltyList;

