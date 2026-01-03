import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  TextInput,
} from 'react-native';
import { getNearbyCafes } from '../../services/cafeService';
import { colors, spacing, typography, shadows } from '../../theme';
import NearbyCafesMap from '../home/components/NearbyCafesMap';
import Input from '../../components/Input';

/**
 * Browse Screen - Göz At
 * Yakındaki kafeler harita ve liste olarak gösterilir
 */
const BrowseScreen = () => {
  const [nearbyCafes, setNearbyCafes] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    restaurantType: '',
    distance: '',
    campaignType: '',
    city: '',
    district: '',
    neighborhood: '',
  });

  // Filtreleme seçenekleri
  const restaurantTypes = ['Tümü', 'Kafe', 'Restoran', 'Pastane', 'Bar'];
  const distances = ['Tümü', '500m', '1km', '2km', '5km'];
  const campaignTypes = ['Tümü', 'İndirim', 'Hediye', 'Puan'];

  useEffect(() => {
    loadNearbyCafes();
  }, []);

  useEffect(() => {
    // Sadece filtreler değişince otomatik filtreleme yap (arama yapılmışsa)
    if (hasSearched && nearbyCafes.length > 0) {
      applyFilters();
    }
  }, [filters]);

  const loadNearbyCafes = async () => {
    setLoading(true);
    try {
      // Mock location - gerçek uygulamada kullanıcı konumu alınacak
      const cafes = await getNearbyCafes(41.0082, 28.9784);
      setNearbyCafes(cafes || []);
    } catch (error) {
      console.error('Error loading cafes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setHasSearched(false);
      setSearchResults([]);
      return;
    }
    
    setHasSearched(true);
    applyFilters();
  };

  const applyFilters = () => {
    let filtered = [...nearbyCafes];
    
    // Arama sorgusu
    if (searchQuery.trim()) {
      filtered = filtered.filter((cafe) =>
        (cafe.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cafe.address || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filtreleme mantığı
    if (filters.restaurantType && filters.restaurantType !== 'Tümü') {
      filtered = filtered.filter((cafe) => cafe.restaurantType === filters.restaurantType);
    }
    if (filters.distance && filters.distance !== 'Tümü') {
      const maxDistance = parseFloat(filters.distance.replace('km', '').replace('m', ''));
      filtered = filtered.filter((cafe) => {
        if (filters.distance.includes('m')) {
          return (cafe.distance || 0) * 1000 <= maxDistance;
        } else {
          return (cafe.distance || 0) <= maxDistance;
        }
      });
    }
    if (filters.campaignType && filters.campaignType !== 'Tümü') {
      if (filters.campaignType === 'İndirim' || filters.campaignType === 'Hediye' || filters.campaignType === 'Puan') {
        filtered = filtered.filter((cafe) => cafe.hasCampaign === true);
      }
    }
    
    setSearchResults(filtered);
    setCurrentPage(1);
  };

  const renderCafeItem = ({ item }) => (
    <View style={styles.cafeItem}>
      <Text style={styles.cafeName}>{item.name || 'Kafe Adı'}</Text>
      {item.address && <Text style={styles.cafeAddress}>{item.address}</Text>}
      {item.distance && (
        <Text style={styles.cafeDistance}>{item.distance.toFixed(2)} km uzaklıkta</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Kafe Ara */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Input
            placeholder="Kafe ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            editable={true}
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Ara</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={() => {
            setShowFilters(!showFilters);
          }}
        >
          <Text style={styles.filterToggleButtonText}>Filtrele</Text>
        </TouchableOpacity>
      </View>

      {/* Filtreler */}
      {showFilters && (
        <View style={styles.filtersContainerWrapper}>
          <ScrollView style={styles.filtersContainer} nestedScrollEnabled={true}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Restoran Türü:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {restaurantTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    filters.restaurantType === type && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setFilters({ ...filters, restaurantType: type === 'Tümü' ? '' : type })
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.restaurantType === type && styles.filterChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Mesafe:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {distances.map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.filterChip,
                    filters.distance === distance && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setFilters({ ...filters, distance: distance === 'Tümü' ? '' : distance })
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.distance === distance && styles.filterChipTextActive,
                    ]}
                  >
                    {distance}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Kampanya Tipi:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {campaignTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.filterChip,
                    filters.campaignType === type && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setFilters({ ...filters, campaignType: type === 'Tümü' ? '' : type })
                  }
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      filters.campaignType === type && styles.filterChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {/* Arama Sonuçları - Sadece arama yapılmışsa göster */}
        {hasSearched && (
          <View style={styles.searchResultsContainer}>
            <View style={styles.listTitleContainer}>
              <Text style={styles.listTitle}>Arama Sonuçları</Text>
            </View>
            {searchResults.length === 0 ? (
              <Text style={styles.emptyText}>Arama sonucu bulunamadı.</Text>
            ) : (
              <View style={styles.cafeListContainer}>
                <FlatList
                  data={searchResults.slice(
                    (currentPage - 1) * itemsPerPage,
                    currentPage * itemsPerPage
                  )}
                  renderItem={renderCafeItem}
                  keyExtractor={(item, index) => `search-result-${index}`}
                  scrollEnabled={false}
                />
                {/* Pagination */}
                {searchResults.length > itemsPerPage && (
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity
                      style={[
                        styles.pageButton,
                        currentPage === 1 && styles.pageButtonDisabled,
                      ]}
                      onPress={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <Text style={styles.pageButtonText}>Önceki</Text>
                    </TouchableOpacity>
                    <Text style={styles.pageInfo}>
                      Sayfa {currentPage} / {Math.ceil(searchResults.length / itemsPerPage)}
                    </Text>
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
                      style={[
                        styles.pageButton,
                        currentPage === Math.ceil(searchResults.length / itemsPerPage) &&
                          styles.pageButtonDisabled,
                      ]}
                      onPress={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === Math.ceil(searchResults.length / itemsPerPage)}
                    >
                      <Text style={styles.pageButtonText}>Sonraki</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Harita - Yakındaki kafeler harita üzerinde gösterilecek */}
        <View style={styles.mapContainer}>
          <NearbyCafesMap />
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
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.background,
  },
  searchButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  searchButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  filterToggleButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.secondary || colors.primary,
    borderRadius: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  cafeListContainer: {
    marginTop: spacing.sm,
  },
  filtersContainerWrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 300,
    zIndex: 1000,
    elevation: 5,
  },
  filterButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    alignItems: 'center',
  },
  filterButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  filtersContainer: {
    padding: spacing.md,
  },
  listTitleContainer: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cafeListContainer: {
    marginTop: spacing.sm,
  },
  filterRow: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
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
  scrollView: {
    flex: 1,
  },
  searchResultsContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: spacing.sm,
    ...shadows.small,
  },
  mapContainer: {
    height: 400,
    margin: spacing.md,
  },
  listTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  cafeItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  cafeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cafeAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cafeDistance: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
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
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  itemsPerPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg,
    fontSize: typography.fontSize.sm,
  },
});

export default BrowseScreen;

