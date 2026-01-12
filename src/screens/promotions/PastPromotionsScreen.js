import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getPastPromotions } from '../../services/userService';
import { colors, spacing, typography, shadows } from '../../theme';
import Logo from '../../components/Logo';

/**
 * Past Promotions Screen - Geçmiş Promosyonlar
 * Süresi bitmiş veya kullanılmış promosyonları listeler
 */
const PastPromotionsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedItems, setExpandedItems] = useState({}); // Açılır/kapanır detaylar için

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const data = await getPastPromotions();
      setPromotions(data || []);
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('promotions.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = promotions.length > 0 ? Math.max(1, Math.ceil(promotions.length / itemsPerPage)) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = promotions.slice(startIndex, endIndex);

  // itemsPerPage değişince sayfa numarasını kontrol et
  useEffect(() => {
    const newTotalPages = promotions.length > 0 ? Math.max(1, Math.ceil(promotions.length / itemsPerPage)) : 0;
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, promotions.length]);

  const toggleDetails = (promotionId) => {
    setExpandedItems(prev => ({
      ...prev,
      [promotionId]: !prev[promotionId],
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderPromotionItem = ({ item }) => {
    const isExpanded = expandedItems[item.promotionId] || false;
    const isExpired = new Date(item.promotionExpireDate) < new Date();

    return (
      <View style={[styles.promotionItem, (isExpired || item.isUsed) && styles.promotionItemInactive]}>
        <View style={styles.promotionHeader}>
          <View style={styles.promotionTextContainer}>
            <Text style={[styles.promotionText, (isExpired || item.isUsed) && styles.promotionTextInactive]}>
              {t('promotions.freeCoffeeEarned', { venueName: item.venueName })}
            </Text>
            {(isExpired || item.isUsed) && (
              <Text style={styles.statusText}>
                {item.isUsed ? t('promotions.used') : t('promotions.expired')}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => toggleDetails(item.promotionId)}
          activeOpacity={0.7}
        >
          <Text style={styles.detailsButtonText}>
            {t('promotions.promotionDetails')} {isExpanded ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('promotions.earnedDate')}:</Text>
              <Text style={styles.detailValue}>{formatDate(item.promotionEarnedDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('promotions.expireDate')}:</Text>
              <Text style={styles.detailValue}>{formatDate(item.promotionExpireDate)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('promotions.status')}:</Text>
              <Text style={styles.detailValue}>
                {item.isUsed ? t('promotions.used') : (isExpired ? t('promotions.expired') : t('promotions.active'))}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Logo ve Geri Butonu - En Üst */}
      <View style={styles.logoContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.logoWrapper}>
          <Logo size="small" />
        </View>
      </View>

      {/* Yeşil Zemin Üzerine Beyaz Yazı Başlık */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{t('promotions.pastTitle')}</Text>
      </View>

      <ScrollView style={styles.scrollView}>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('promotions.loading')}</Text>
          </View>
        ) : promotions.length === 0 ? (
          <Text style={styles.emptyText}>{t('promotions.noPastPromotions')}</Text>
        ) : (
          <View style={styles.listContainer}>
            <FlatList
              data={paginatedData}
              renderItem={renderPromotionItem}
              keyExtractor={(item) => `promotion-${item.promotionId}`}
              scrollEnabled={false}
            />

            {/* Pagination */}
            {promotions.length > 0 && totalPages > 0 && (
              <View style={styles.paginationContainer}>
                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    currentPage === 1 && styles.pageButtonDisabled,
                  ]}
                  onPress={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <Text style={styles.pageButtonText}>{t('browse.previous')}</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>
                  {t('browse.page')} {currentPage} / {totalPages}
                </Text>
                <View style={styles.itemsPerPageContainer}>
                  <Text style={styles.itemsPerPageLabel}>{t('browse.show')}:</Text>
                  {[5, 10, 20, 50].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.itemsPerPageButton,
                        itemsPerPage === num && styles.itemsPerPageButtonActive,
                      ]}
                      onPress={() => {
                        setItemsPerPage(num);
                        setCurrentPage(1);
                      }}
                    >
                      <Text
                        style={[
                          styles.itemsPerPageText,
                          itemsPerPage === num && styles.itemsPerPageTextActive,
                        ]}
                      >
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={[
                    styles.pageButton,
                    currentPage === totalPages && styles.pageButtonDisabled,
                  ]}
                  onPress={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <Text style={styles.pageButtonText}>{t('browse.next')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    position: 'absolute',
    left: spacing.md,
    padding: spacing.xs,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: typography.fontSize.xxl || 28, // Boyutu büyüt
    color: colors.primary, // Yeşil renk
    fontWeight: typography.fontWeight.bold,
  },
  logoWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    padding: spacing.xl,
    textAlign: 'center',
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  listContainer: {
    padding: spacing.md,
  },
  promotionItem: {
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  promotionItemInactive: {
    opacity: 0.6,
  },
  promotionHeader: {
    marginBottom: spacing.sm,
  },
  promotionTextContainer: {
    flex: 1,
  },
  promotionText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  promotionTextInactive: {
    color: colors.textSecondary,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  detailsButton: {
    paddingVertical: spacing.xs,
  },
  detailsButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  detailsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    marginTop: spacing.md,
  },
  pageButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: spacing.xs,
  },
  pageButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  pageInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  itemsPerPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemsPerPageLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  itemsPerPageButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginLeft: spacing.xs,
    borderRadius: spacing.xs,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemsPerPageButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemsPerPageText: {
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  itemsPerPageTextActive: {
    color: colors.white,
  },
});

export default PastPromotionsScreen;
