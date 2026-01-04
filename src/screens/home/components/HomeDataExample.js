/**
 * HomeDataExample Component
 * 
 * Bu component, yeni getHomeData() servisinin nasıl kullanılacağını gösterir.
 * Production'da kullanmak için HomeScreen'e entegre edilebilir.
 * 
 * Kullanım:
 * import HomeDataExample from './components/HomeDataExample';
 * <HomeDataExample />
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { getHomeData } from '../../../services/userService';
import { colors, spacing, typography, shadows } from '../../../theme';

const HomeDataExample = () => {
  const [homeData, setHomeData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    try {
      // getHomeData() servisi otomatik olarak mock veya gerçek API kullanır
      // USE_MOCK_API flag'ine göre karar verilir
      const data = await getHomeData();
      setHomeData(data);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Ana sayfa verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!homeData) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ana Sayfa Verileri</Text>
      
      {/* İstatistikler */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{homeData.totalOrders || 0}</Text>
          <Text style={styles.statLabel}>Toplam Sipariş</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{homeData.totalCafes || 0}</Text>
          <Text style={styles.statLabel}>Toplam Kafe</Text>
        </View>
      </View>

      {/* Sadakat Kafeleri */}
      {homeData.loyaltyCafes && homeData.loyaltyCafes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>En Çok Gittiğiniz Kafeler</Text>
          {homeData.loyaltyCafes.map((cafe, index) => (
            <View key={index} style={styles.cafeItem}>
              <Text style={styles.cafeName}>{cafe.cafeName}</Text>
              <Text style={styles.cafeStat}>
                {cafe.orderCount || 0} sipariş
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Yakındaki Kafeler */}
      {homeData.nearbyCafes && homeData.nearbyCafes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yakındaki Kafeler</Text>
          {homeData.nearbyCafes.map((cafe, index) => (
            <View key={index} style={styles.cafeItem}>
              <Text style={styles.cafeName}>{cafe.name}</Text>
              <Text style={styles.cafeDistance}>
                {cafe.distance?.toFixed(1)} km
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  cafeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cafeName: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  cafeStat: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  cafeDistance: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
  },
});

export default HomeDataExample;

