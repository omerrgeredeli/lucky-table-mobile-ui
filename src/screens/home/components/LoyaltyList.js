import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserLoyaltyInfo } from '../../../services/userService';
import { colors, spacing, typography, shadows } from '../../../theme';

/**
 * LoyaltyList Component - Micro-Screen Architecture
 * Kullanıcının sipariş ve sadakat bilgilerini gösterir
 * Bu component tamamen bağımsızdır, kendi state'ini yönetir
 */
const LoyaltyList = () => {
  const navigation = useNavigation();
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
      Alert.alert('Hata', 'Sadakat bilgileri yüklenemedi. Lütfen tekrar deneyin.');
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
        <Text style={styles.cafeName}>{item.cafeName || 'Kafe Adı'}</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statText}>
            Toplam Sipariş: <Text style={styles.statValue}>{item.orderCount || 0}</Text>
          </Text>
          <Text style={styles.statText}>
            Ücretsiz Ürün: <Text style={styles.statValue}>{item.freeProductAt || 10}</Text>. siparişte
          </Text>
          <Text style={styles.progressText}>
            Bir sonraki ücretsiz ürün için: <Text style={styles.progressValue}>{nextFreeAt}</Text> sipariş kaldı
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Sadakat Bilgileri</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('LoyaltyDetails')}
          style={styles.viewAllButton}
        >
          <Text style={styles.viewAllText}>Tümünü Gör →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Yükleniyor...</Text>
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : displayedCafes.length === 0 ? (
          <Text style={styles.emptyText}>Henüz sipariş geçmişiniz bulunmuyor.</Text>
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
  cafeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
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
});

export default LoyaltyList;

