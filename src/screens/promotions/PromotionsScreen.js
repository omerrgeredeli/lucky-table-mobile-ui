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
import { getActivePromotions } from '../../services/userService';
import { colors, spacing, typography, shadows } from '../../theme';
import Logo from '../../components/Logo';
import QRCodeModal from '../../components/QRCodeModal';

/**
 * Promotions Screen - Kazanılan Promosyonlar
 * Aktif promosyonları listeler, QR Code ile kullanım sağlar
 */
const PromotionsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedItems, setExpandedItems] = useState({}); // Açılır/kapanır detaylar için
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const data = await getActivePromotions();
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

  const handleUsePromotion = (promotion) => {
    setSelectedPromotion(promotion);
    setShowQRModal(true);
  };

  const handleShowNearbyVenues = (venueName) => {
    // BrowseScreen'e yönlendir ve arama yap
    navigation.navigate('Browse', { searchQuery: venueName });
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

    return (
      <View style={styles.promotionItem}>
        <View style={styles.promotionHeader}>
          <View style={styles.promotionTextContainer}>
            <Text style={styles.promotionText}>
              {t('promotions.freeCoffeeEarned', { venueName: item.venueName })}
            </Text>
          </View>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.useButton}
            onPress={() => handleUsePromotion(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.useButtonText}>{t('promotions.usePromotion')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nearbyButton}
            onPress={() => handleShowNearbyVenues(item.venueName)}
            activeOpacity={0.7}
          >
            <Text style={styles.nearbyButtonText}>{t('promotions.showNearbyVenues')}</Text>
          </TouchableOpacity>
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
              <Text style={styles.detailLabel}>
                {t('promotions.earnedDate')}: <Text style={styles.detailValue}>{formatDate(item.promotionEarnedDate)}</Text>
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {t('promotions.expireDate')}: <Text style={styles.detailValue}>{formatDate(item.promotionExpireDate)}</Text>
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Logo size="small" />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            {t('promotions.title')} ({promotions.length})
          </Text>
          <TouchableOpacity
            style={styles.pastButton}
            onPress={() => navigation.navigate('PastPromotions')}
            activeOpacity={0.7}
          >
            <Text style={styles.pastButtonText}>{t('promotions.past')}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('promotions.loading')}</Text>
          </View>
        ) : promotions.length === 0 ? (
          <Text style={styles.emptyText}>{t('promotions.noPromotions')}</Text>
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

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrData={selectedPromotion}
        venueName={selectedPromotion?.venueName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  logoContainer: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  pastButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: spacing.xs,
  },
  pastButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
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
  buttonsContainer: {
    marginBottom: spacing.sm,
    alignItems: 'flex-end', // Butonları sağa yasla
  },
  useButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: spacing.xs,
    marginBottom: spacing.xs,
    alignSelf: 'flex-end', // Butonları sağa yasla
    width: 200, // En Yakın Kafeleri Göster butonunun uzunluğuna eşitle
  },
  useButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    textAlign: 'left', // Yazıyı sola yasla
  },
  nearbyButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: spacing.xs,
    alignSelf: 'flex-end', // Butonları sağa yasla
    width: 200, // Buton uzunluğunu sabitle (En Yakın Kafeleri Göster butonunun uzunluğu)
  },
  nearbyButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
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

export default PromotionsScreen;
