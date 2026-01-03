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
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getUserLoyaltyInfo } from '../../services/userService';
import { colors, spacing, typography, shadows } from '../../theme';

/**
 * Loyalty Details Screen - Sadakat Bilgileri Detay
 * Tüm kafeler, filtreleme, sıralama ve pagination
 */
const LoyaltyDetailsScreen = () => {
  const navigation = useNavigation();
  const [loyaltyData, setLoyaltyData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  // İl-İlçe-Semt verileri
  const cityData = {
    'İstanbul': {
      districts: ['Kadıköy', 'Beşiktaş', 'Şişli', 'Beyoğlu', 'Üsküdar'],
      neighborhoods: {
        'Kadıköy': ['Moda', 'Fenerbahçe', 'Bostancı'],
        'Beşiktaş': ['Bebek', 'Ortaköy', 'Etiler'],
        'Şişli': ['Nişantaşı', 'Mecidiyeköy', 'Levent'],
        'Beyoğlu': ['Taksim', 'Galata', 'Karaköy'],
        'Üsküdar': ['Ortaköy', 'Çengelköy', 'Kuzguncuk'],
      },
    },
    'Ankara': {
      districts: ['Çankaya', 'Keçiören', 'Yenimahalle'],
      neighborhoods: {
        'Çankaya': ['Kızılay', 'Bahçelievler', 'Çankaya'],
        'Keçiören': ['Etlik', 'Akpınar', 'Kalaba'],
        'Yenimahalle': ['Demetevler', 'Batıkent', 'Yenimahalle'],
      },
    },
    'İzmir': {
      districts: ['Konak', 'Bornova', 'Karşıyaka'],
      neighborhoods: {
        'Konak': ['Alsancak', 'Konak', 'Basmane'],
        'Bornova': ['Bornova', 'Bostanlı', 'Çiğli'],
        'Karşıyaka': ['Karşıyaka', 'Bostanlı', 'Alaybey'],
      },
    },
  };

  // Filtreler
  const [filters, setFilters] = useState({
    city: '',
    district: '',
    neighborhood: '',
    foodType: '',
    campaign: '',
    dateFrom: '',
    dateTo: '',
  });

  // Sıralama
  const [sortBy, setSortBy] = useState('dateDesc'); // dateDesc, dateAsc, nameAsc, nameDesc, orderCountDesc, orderCountAsc, nextOrderDesc, nextOrderAsc

  useEffect(() => {
    fetchLoyaltyInfo();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [filters, sortBy, loyaltyData]);

  const fetchLoyaltyInfo = async () => {
    setLoading(true);
    try {
      const data = await getUserLoyaltyInfo();
      setLoyaltyData(data || []);
      setFilteredData(data || []);
    } catch (error) {
      Alert.alert('Hata', 'Sadakat bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...loyaltyData];

    // Filtreleme
    if (filters.city) {
      filtered = filtered.filter((item) => item.city === filters.city);
    }
    if (filters.district) {
      filtered = filtered.filter((item) => item.district === filters.district);
    }
    if (filters.neighborhood) {
      filtered = filtered.filter((item) => item.neighborhood === filters.neighborhood);
    }
    if (filters.foodType) {
      filtered = filtered.filter((item) => item.foodTypes?.includes(filters.foodType));
    }
    if (filters.campaign === 'true') {
      filtered = filtered.filter((item) => item.hasCampaign);
    } else if (filters.campaign === 'false') {
      filtered = filtered.filter((item) => !item.hasCampaign);
    }
    
    // Tarih aralığı filtreleme
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom).getTime();
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.lastOrderDate || 0).getTime();
        return itemDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo).getTime();
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.lastOrderDate || 0).getTime();
        return itemDate <= toDate;
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
      {/* Filtre ve Sıralama Butonları */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setShowFilters(!showFilters);
            if (!showFilters) setShowSort(false);
          }}
        >
          <Text style={styles.actionButtonText}>Filtrele</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setShowSort(!showSort);
            if (!showSort) setShowFilters(false);
          }}
        >
          <Text style={styles.actionButtonText}>Sırala</Text>
        </TouchableOpacity>
      </View>

      {/* Filtreler */}
      {showFilters && (
        <View style={styles.filtersContainerWrapper}>
          <ScrollView style={styles.filtersContainer} nestedScrollEnabled={true}>
            <Text style={styles.filterTitle}>Filtreleme Seçenekleri</Text>
            
            {/* Şehir */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Şehir:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true}>
                {['Tümü', 'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'].map((city) => (
                  <TouchableOpacity
                    key={city}
                    style={[
                      styles.filterChip,
                      filters.city === city && styles.filterChipActive,
                    ]}
                    onPress={() => {
                      setFilters({ 
                        ...filters, 
                        city: city === 'Tümü' ? '' : city,
                        district: '', // İl değişince ilçe sıfırlanır
                        neighborhood: '', // İl değişince semt sıfırlanır
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.city === city && styles.filterChipTextActive,
                      ]}
                    >
                      {city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* İlçe - Sadece il seçilmişse göster */}
            {filters.city && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>İlçe:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true}>
                  {['Tümü', ...(cityData[filters.city]?.districts || [])].map((district) => (
                    <TouchableOpacity
                      key={district}
                      style={[
                        styles.filterChip,
                        filters.district === district && styles.filterChipActive,
                      ]}
                      onPress={() => {
                        setFilters({ 
                          ...filters, 
                          district: district === 'Tümü' ? '' : district,
                          neighborhood: '', // İlçe değişince semt sıfırlanır
                        });
                      }}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.district === district && styles.filterChipTextActive,
                        ]}
                      >
                        {district}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Semt - Sadece ilçe seçilmişse göster */}
            {filters.city && filters.district && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Semt:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true}>
                  {['Tümü', ...(cityData[filters.city]?.neighborhoods?.[filters.district] || [])].map((neighborhood) => (
                    <TouchableOpacity
                      key={neighborhood}
                      style={[
                        styles.filterChip,
                        filters.neighborhood === neighborhood && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setFilters({ ...filters, neighborhood: neighborhood === 'Tümü' ? '' : neighborhood })
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          filters.neighborhood === neighborhood && styles.filterChipTextActive,
                        ]}
                      >
                        {neighborhood}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Yiyecek/İçecek Çeşidi */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Yiyecek/İçecek Çeşidi:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true}>
                {['Tümü', 'Kahve', 'Çay', 'Pasta', 'Sandviç', 'Salata', 'Pizza', 'Burger'].map((foodType) => (
                  <TouchableOpacity
                    key={foodType}
                    style={[
                      styles.filterChip,
                      filters.foodType === foodType && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, foodType: foodType === 'Tümü' ? '' : foodType })
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.foodType === foodType && styles.filterChipTextActive,
                      ]}
                    >
                      {foodType}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Kampanya */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Kampanya:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled={true}>
                {['Tümü', 'Kampanyalı', 'Kampanyasız'].map((campaign) => (
                  <TouchableOpacity
                    key={campaign}
                    style={[
                      styles.filterChip,
                      filters.campaign === campaign && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setFilters({ ...filters, campaign: campaign === 'Tümü' ? '' : campaign === 'Kampanyalı' ? 'true' : 'false' })
                    }
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        filters.campaign === campaign && styles.filterChipTextActive,
                      ]}
                    >
                      {campaign}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tarih Aralığı */}
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Tarih Aralığı:</Text>
              <View style={styles.dateRangeContainer}>
                <Text style={styles.dateLabel}>Başlangıç:</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={filters.dateFrom}
                  onChangeText={(text) => setFilters({ ...filters, dateFrom: text })}
                />
                <Text style={styles.dateLabel}>Bitiş:</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="YYYY-MM-DD"
                  value={filters.dateTo}
                  onChangeText={(text) => setFilters({ ...filters, dateTo: text })}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Sıralama */}
      {showSort && (
        <View style={styles.sortContainer}>
          <Text style={styles.sortTitle}>Sıralama Seçenekleri</Text>
          {[
            { value: 'dateDesc', label: 'Tarihe göre (Yeni → Eski)' },
            { value: 'dateAsc', label: 'Tarihe göre (Eski → Yeni)' },
            { value: 'nameAsc', label: 'Alfabetik (A → Z)' },
            { value: 'nameDesc', label: 'Alfabetik (Z → A)' },
            { value: 'orderCountDesc', label: 'En çok kullanılan' },
            { value: 'orderCountAsc', label: 'En az kullanılan' },
            { value: 'nextOrderDesc', label: 'Sonraki ürün (Çok → Az)' },
            { value: 'nextOrderAsc', label: 'Sonraki ürün (Az → Çok)' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortBy === option.value && styles.sortOptionActive,
              ]}
              onPress={() => {
                setSortBy(option.value);
                setShowSort(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.value && styles.sortOptionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Liste */}
      <FlatList
        data={paginatedData}
        renderItem={renderCafeItem}
        keyExtractor={(item, index) => `cafe-${index}`}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Henüz sipariş geçmişiniz bulunmuyor.</Text>
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
            <Text style={styles.pageButtonText}>Önceki</Text>
          </TouchableOpacity>

          <View style={styles.pageInfo}>
            <Text style={styles.pageInfoText}>
              Sayfa {currentPage} / {totalPages}
            </Text>
          </View>

          <View style={styles.itemsPerPageContainer}>
            <Text style={styles.itemsPerPageLabel}>Göster:</Text>
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
            <Text style={styles.pageButtonText}>Sonraki</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  },
  pageInfoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
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
});

export default LoyaltyDetailsScreen;

