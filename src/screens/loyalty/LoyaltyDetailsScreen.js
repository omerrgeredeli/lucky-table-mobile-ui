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
  Modal,
  TouchableWithoutFeedback,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { getUserLoyaltyInfo } from '../../services/userService';
import { colors, spacing, typography, shadows } from '../../theme';
import FilterScreen from '../../components/FilterScreen';
import { locationData } from '../../data/locationData';
import Logo from '../../components/Logo';

/**
 * Loyalty Details Screen - Sadakat Bilgileri Detay
 * Tüm kafeler, filtreleme, sıralama ve pagination
 */
const LoyaltyDetailsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [loyaltyData, setLoyaltyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [showOrderHistoryModal, setShowOrderHistoryModal] = useState(false);
  
  // Yeni filtre state (backend'e hazır)
  const [filterPayload, setFilterPayload] = useState(null);

  // Sıralama
  const [sortBy, setSortBy] = useState('dateDesc'); // dateDesc, dateAsc, nameAsc, nameDesc, orderCountDesc, orderCountAsc, nextOrderDesc, nextOrderAsc

  useEffect(() => {
    fetchLoyaltyInfo();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [filterPayload, sortBy, loyaltyData]);

  const fetchLoyaltyInfo = async () => {
    setLoading(true);
    try {
      const data = await getUserLoyaltyInfo();
      setLoyaltyData(data || []);
      setFilteredData(data || []);
    } catch (error) {
      Alert.alert(t('common.error'), t('loyalty.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...loyaltyData];

    // Yeni filtreleme mantığı (backend payload'a göre)
    if (filterPayload) {
      // Konum filtreleme
      if (filterPayload.cityId) {
        const selectedCity = locationData.find((city) => city.id === filterPayload.cityId);
        if (selectedCity) {
          filtered = filtered.filter((item) => item.city === selectedCity.name);
          
          if (filterPayload.districtId) {
            const selectedDistrict = selectedCity.districts.find(
              (district) => district.id === filterPayload.districtId
            );
            if (selectedDistrict) {
              filtered = filtered.filter((item) => item.district === selectedDistrict.name);
              
              if (filterPayload.neighborhoodId) {
                const selectedNeighborhood = selectedDistrict.neighborhoods.find(
                  (neighborhood) => neighborhood.id === filterPayload.neighborhoodId
                );
                if (selectedNeighborhood) {
                  filtered = filtered.filter(
                    (item) => item.neighborhood === selectedNeighborhood.name
                  );
                }
              }
            }
          }
        }
      }

      // Tarih aralığı filtreleme - orderHistory'deki tarihlere göre
      // Sadece seçilen tarih aralığında siparişi olan kafeleri göster
      if (filterPayload.startDate || filterPayload.endDate) {
        filtered = filtered.filter((item) => {
          // orderHistory yoksa kafe gösterilmez
          if (!item.orderHistory || item.orderHistory.length === 0) {
            return false;
          }
          
          // orderHistory'deki tarihlerden herhangi biri aralıkta mı kontrol et
          const hasDateInRange = item.orderHistory.some((order) => {
            if (!order.date) return false;
            const orderDateStr = order.date; // YYYY-MM-DD formatı
            
            let inRange = true;
            if (filterPayload.startDate) {
              if (orderDateStr < filterPayload.startDate) {
                inRange = false;
              }
            }
            if (filterPayload.endDate) {
              if (orderDateStr > filterPayload.endDate) {
                inRange = false;
              }
            }
            return inRange;
          });
          
          return hasDateInRange;
        });

        // Aktif tarih filtresi varken, her kafe için bu aralıktaki sipariş sayısını hesapla
        filtered = filtered.map((item) => {
          const rangeCount = (item.orderHistory || []).filter((order) => {
            if (!order.date) return false;
            const orderDateStr = order.date;
            if (filterPayload.startDate && orderDateStr < filterPayload.startDate) return false;
            if (filterPayload.endDate && orderDateStr > filterPayload.endDate) return false;
            return true;
          }).length;
          return { ...item, dateRangeOrderCount: rangeCount };
        });
      }

      // Kategori filtreleme - orderHistory'deki orderType'lara göre
      if (filterPayload.categoryType && filterPayload.subCategories.length > 0) {
        filtered = filtered.filter((item) => {
          if (!item.orderHistory || item.orderHistory.length === 0) return false;
          
          // Alt kategori ID'lerini isimlere çevir (foodCategories'den)
          const { foodCategories } = require('../../data/foodCategories');
          const selectedSubCategoryNames = filterPayload.subCategories.map((subCatId) => {
            const subCat = foodCategories[filterPayload.categoryType]?.subCategories.find(
              (sc) => sc.id === subCatId
            );
            return subCat?.name || '';
          }).filter(Boolean);
          
          // orderHistory'de bu kategorilerden biri var mı kontrol et
          return item.orderHistory.some((order) => {
            return selectedSubCategoryNames.some((categoryName) => {
              // Case-insensitive karşılaştırma
              return (order.orderType || '').toLowerCase() === categoryName.toLowerCase();
            });
          });
        });
      }
    } else {
      // Aktif filtre yoksa, eklenmiş olabilecek dateRangeOrderCount alanını temizle
      filtered = filtered.map((item) => {
        const { dateRangeOrderCount, ...rest } = item;
        return rest;
      });
    }

    // Sıralama
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dateDesc':
          return (b.lastOrderDate || 0) - (a.lastOrderDate || 0);
        case 'dateAsc':
          return (a.lastOrderDate || 0) - (b.lastOrderDate || 0);
        case 'nameAsc':
          return (a.cafeName || '').localeCompare(b.cafeName || '');
        case 'nameDesc':
          return (b.cafeName || '').localeCompare(a.cafeName || '');
        case 'orderCountDesc':
          return (b.orderCount || 0) - (a.orderCount || 0);
        case 'orderCountAsc':
          return (a.orderCount || 0) - (b.orderCount || 0);
        case 'nextOrderDesc': {
          const aNext = (a.freeProductAt || 10) - ((a.orderCount || 0) % (a.freeProductAt || 10));
          const bNext = (b.freeProductAt || 10) - ((b.orderCount || 0) % (b.freeProductAt || 10));
          return bNext - aNext;
        }
        case 'nextOrderAsc': {
          const aNext = (a.freeProductAt || 10) - ((a.orderCount || 0) % (a.freeProductAt || 10));
          const bNext = (b.freeProductAt || 10) - ((b.orderCount || 0) % (b.freeProductAt || 10));
          return aNext - bNext;
        }
        default:
          return 0;
      }
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = filteredData.length > 0 ? Math.max(1, Math.ceil(filteredData.length / itemsPerPage)) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  
  // itemsPerPage değişince sayfa numarasını kontrol et
  useEffect(() => {
    const newTotalPages = filteredData.length > 0 ? Math.max(1, Math.ceil(filteredData.length / itemsPerPage)) : 0;
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, filteredData.length]);

  const renderCafeItem = ({ item }) => {
    const freeProductAt = item.freeProductAt || 10;
    const progress = item.orderCount % freeProductAt;
    const nextFreeAt = freeProductAt - progress;
    const hasDateFilter =
      !!(filterPayload && (filterPayload.startDate || filterPayload.endDate));

    return (
      <TouchableOpacity
        style={styles.cafeItem}
        onPress={() => {
          setSelectedCafe(item);
          setShowOrderHistoryModal(true);
        }}
        activeOpacity={0.7}
      >
        {/* Logo ve Kafe Adı - HomeScreen ile aynı yapı */}
        <View style={styles.cafeHeader}>
          {(item.cafeLogo || item.logoUrl) ? (
            <Image
              source={{ uri: item.cafeLogo || item.logoUrl }}
              style={styles.cafeLogo}
              // resizeMode kaldırıldı - HomeScreen ile aynı (default kullanılacak)
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
          {hasDateFilter && (
            <Text style={styles.statText}>
              {t('loyalty.dateRangeOrder')}:{" "}
              <Text style={styles.statValue}>{item.dateRangeOrderCount || 0}</Text>
            </Text>
          )}
          <Text style={styles.statText}>
            {t('loyalty.totalOrders')}: <Text style={styles.statValue}>{item.orderCount || 0}</Text>
          </Text>
          {!hasDateFilter && (
            <>
              <Text style={styles.statText}>
                {t('loyalty.freeProductAt')}: <Text style={styles.statValue}>{item.freeProductAt || 10}</Text> {t('loyalty.freeProductAtOrder')}
              </Text>
              <Text style={styles.progressText}>
                {t('loyalty.nextFreeProduct')}: <Text style={styles.progressValue}>{nextFreeAt}</Text> {t('loyalty.ordersLeft')}
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Tarih formatlama fonksiyonu
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <View style={styles.container}>
      {/* Logo ve Geri Butonu - En Üst */}
      <View style={styles.logoContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Home')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.logoWrapper}>
          <Logo size="small" />
        </View>
      </View>

      {/* Yeşil Zemin Üzerine Beyaz Yazı Başlık - Sola Yaslı */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          {t('loyalty.favoritePlaces')} ({filteredData.length})
        </Text>
      </View>

      {/* Filtre ve Sıralama Butonları */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setShowFilterModal(true);
            setShowSortModal(false);
          }}
        >
          <Text style={styles.actionButtonText}>
            {t('loyalty.filter')}{filterPayload && ' ✓'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setShowSortModal(true);
            setShowFilterModal(false);
          }}
        >
          <Text style={styles.actionButtonText}>{t('loyalty.sort')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            // Tüm filtreleri sıfırla ve güncel (tam) veriyi göster
            setFilterPayload(null);
            setShowFilterModal(false);
          }}
        >
          <Text style={styles.actionButtonText}>{t('loyalty.currentData')}</Text>
        </TouchableOpacity>
      </View>

      {/* FilterScreen Modal */}
      <FilterScreen
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(payload) => {
          setFilterPayload(payload);
          setShowFilterModal(false);
        }}
        initialFilters={filterPayload}
      />


      {/* Sıralama Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowSortModal(false)}>
            <View style={styles.modalOverlayTouchable} />
          </TouchableWithoutFeedback>
          <View style={styles.sortModalContent}>
            <View style={styles.sortModalHeader}>
              <Text style={styles.sortModalTitle}>{t('loyalty.sortOptions')}</Text>
              <TouchableOpacity
                onPress={() => setShowSortModal(false)}
                style={styles.sortModalCloseButton}
              >
                <Text style={styles.sortModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sortModalBody}>
              {[
                { value: 'dateDesc', label: t('loyalty.sortByDateDesc') },
                { value: 'dateAsc', label: t('loyalty.sortByDateAsc') },
                { value: 'nameAsc', label: t('loyalty.sortByNameAsc') },
                { value: 'nameDesc', label: t('loyalty.sortByNameDesc') },
                { value: 'orderCountDesc', label: t('loyalty.sortByOrderCountDesc') },
                { value: 'orderCountAsc', label: t('loyalty.sortByOrderCountAsc') },
                { value: 'nextOrderDesc', label: t('loyalty.sortByNextOrderDesc') },
                { value: 'nextOrderAsc', label: t('loyalty.sortByNextOrderAsc') },
              ].map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortModalOption,
                    sortBy === option.value && styles.sortModalOptionActive,
                  ]}
                  onPress={() => {
                    setSortBy(option.value);
                    setShowSortModal(false); // Seçim yapınca modal kapanır
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.sortModalOptionText,
                      sortBy === option.value && styles.sortModalOptionTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {sortBy === option.value && (
                    <Text style={styles.sortModalCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Liste */}
      <FlatList
        data={paginatedData}
        renderItem={renderCafeItem}
        keyExtractor={(item, index) => `cafe-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('loyalty.noOrderHistory')}</Text>
        }
      />

      {/* Pagination */}
      {filteredData.length > 0 && totalPages > 0 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
            onPress={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Text style={styles.pageButtonText}>{t('loyalty.previous')}</Text>
          </TouchableOpacity>

          <View style={styles.pageInfo}>
            <Text style={styles.pageInfoText} numberOfLines={1}>
              {t('loyalty.page')} {currentPage} / {totalPages}
            </Text>
          </View>

          <View style={styles.itemsPerPageContainer}>
            <Text style={styles.itemsPerPageLabel}>{t('loyalty.show')}:</Text>
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
            style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
            onPress={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.pageButtonText}>{t('loyalty.next')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sipariş Geçmişi Modal */}
      <Modal
        visible={showOrderHistoryModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOrderHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setShowOrderHistoryModal(false)}>
            <View style={styles.modalOverlayTouchable} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCafe?.cafeName || t('loyalty.cafeName')} - {t('loyalty.orderHistory')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowOrderHistoryModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              nestedScrollEnabled={Platform.OS === 'android'}
              showsVerticalScrollIndicator={true}
            >
              {(() => {
                // Tarih filtresi varsa, sadece o aralıktaki siparişleri göster
                let filteredOrderHistory = selectedCafe?.orderHistory || [];
                
                if (filterPayload && (filterPayload.startDate || filterPayload.endDate)) {
                  filteredOrderHistory = filteredOrderHistory.filter((order) => {
                    if (!order.date) return false;
                    const orderDateStr = order.date; // YYYY-MM-DD formatı
                    
                    let inRange = true;
                    if (filterPayload.startDate) {
                      if (orderDateStr < filterPayload.startDate) {
                        inRange = false;
                      }
                    }
                    if (filterPayload.endDate) {
                      if (orderDateStr > filterPayload.endDate) {
                        inRange = false;
                      }
                    }
                    return inRange;
                  });
                }
                
                return filteredOrderHistory.length > 0 ? (
                  <>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableHeaderText, styles.tableHeaderDate]}>{t('loyalty.date')}</Text>
                      <Text style={[styles.tableHeaderText, styles.tableHeaderBranch]}>{t('loyalty.branch')}</Text>
                      <Text style={[styles.tableHeaderText, styles.tableHeaderType]}>{t('loyalty.orderType')}</Text>
                    </View>
                    {filteredOrderHistory.map((order, index) => {
                      // Çoklu sipariş türünü alfabetik sırala ve '-' ile birleştir
                      const orderTypes = order.orderTypes || (order.orderType ? [order.orderType] : []);
                      const sortedOrderTypes = [...new Set(orderTypes)].sort();
                      // Sipariş tiplerini translate et
                      const orderTypesDisplay = sortedOrderTypes
                        .map((type) => t(`filter.orderTypes.${type}`, { defaultValue: type }))
                        .join(' - ');
                      
                      return (
                        <View key={index} style={styles.tableRow}>
                          <Text style={[styles.tableCell, styles.tableCellDate]}>
                            {formatDate(order.date)}
                          </Text>
                          <Text style={[styles.tableCell, styles.tableCellBranch]}>
                            {order.branch || t('loyalty.centerBranch', { defaultValue: 'Merkez' })}
                          </Text>
                          <Text style={[styles.tableCell, styles.tableCellType]}>
                            {orderTypesDisplay}
                          </Text>
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <Text style={styles.emptyHistoryText}>
                    {filterPayload && (filterPayload.startDate || filterPayload.endDate)
                      ? t('loyalty.noOrderHistoryInRange')
                      : t('loyalty.noOrderHistory')}
                  </Text>
                );
              })()}
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseButtonFooter}
                onPress={() => setShowOrderHistoryModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  filtersContainerWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 400,
    zIndex: 1000,
    elevation: 5,
  },
  filtersContainer: {
    padding: spacing.md,
  },
  filterTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  dateLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.xs,
    marginTop: spacing.sm,
  },
  dateInput: {
    flex: 1,
    minWidth: 120,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
  },
  // Eski sort styles - artık kullanılmıyor ama silmedim
  sortContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  sortOption: {
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: spacing.sm,
    backgroundColor: colors.background,
  },
  sortOptionActive: {
    backgroundColor: colors.primary,
  },
  sortOptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  sortOptionTextActive: {
    color: colors.white,
  },
  // Sıralama Modal Styles
  sortModalContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    width: '85%',
    maxWidth: 400,
    maxHeight: '70%',
    ...shadows.large,
    overflow: 'hidden',
  },
  sortModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortModalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  sortModalCloseButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModalCloseText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  sortModalBody: {
    maxHeight: 400,
  },
  sortModalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortModalOptionActive: {
    backgroundColor: colors.primary,
  },
  sortModalOptionText: {
    fontSize: typography.fontSize.md,
    color: colors.textPrimary,
    flex: 1,
  },
  sortModalOptionTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  sortModalCheckmark: {
    fontSize: typography.fontSize.lg,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.sm,
  },
  listContent: {
    padding: spacing.md,
  },
  cafeItem: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    ...shadows.small,
  },
  cafeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm, // HomeScreen ile aynı
  },
  cafeLogo: {
    width: 40, // HomeScreen ile aynı (LoyaltyList'te 40x40)
    height: 40, // HomeScreen ile aynı
    borderRadius: spacing.xs, // HomeScreen ile aynı
    marginRight: spacing.sm, // HomeScreen ile aynı
    // resizeMode kaldırıldı - HomeScreen ile aynı (default kullanılacak)
  },
  cafeLogoPlaceholder: {
    backgroundColor: colors.primary, // HomeScreen ile aynı
    justifyContent: 'center',
    alignItems: 'center',
  },
  cafeLogoPlaceholderText: {
    color: colors.white, // HomeScreen ile aynı
    fontSize: typography.fontSize.lg, // HomeScreen ile aynı
    fontWeight: typography.fontWeight.bold, // HomeScreen ile aynı
  },
  cafeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1, // HomeScreen ile aynı
    marginBottom: 0, // marginBottom kaldırıldı, cafeHeader'da marginBottom var
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
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pageButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  pageInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  pageInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    textAlign: 'center',
    flexShrink: 0,
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
  },
  itemsPerPageButtonActive: {
    backgroundColor: colors.primary,
  },
  itemsPerPageText: {
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
  },
  itemsPerPageTextActive: {
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    width: '95%',
    maxWidth: 1200, // Genişletildi
    maxHeight: '90%',
    minHeight: 400, // Minimum yükseklik
    flexDirection: 'column',
    ...shadows.large,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  modalBody: {
    flex: 1,
    padding: spacing.lg,
    minHeight: 400, // Genişletildi
  },
  modalBodyContent: {
    paddingBottom: spacing.xl,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tableHeaderText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  tableHeaderDate: {
    flex: 1,
  },
  tableHeaderBranch: {
    flex: 1,
  },
  tableHeaderType: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  tableCellDate: {
    flex: 1,
  },
  tableCellBranch: {
    flex: 1,
  },
  tableCellType: {
    flex: 1,
  },
  emptyHistoryText: {
    textAlign: 'center',
    color: colors.textSecondary,
    padding: spacing.xl,
    fontSize: typography.fontSize.sm,
  },
  modalFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCloseButtonFooter: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default LoyaltyDetailsScreen;

