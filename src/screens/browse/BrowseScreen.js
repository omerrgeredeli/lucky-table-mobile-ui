import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Platform,
  AppState,
} from 'react-native';
import * as Location from 'expo-location';
import { getNearbyCafes } from '../../services/cafeService';
import { colors, spacing, typography, shadows } from '../../theme';
import BrowseMapScreen from './components/BrowseMapScreen';
import BrowseFilterModal from './components/BrowseFilterModal';
import Input from '../../components/Input';
import { sortCafesByDistance } from '../../utils/distanceUtils';

/**
 * Browse Screen - Göz At
 * Sahibinden.com benzeri filtreleme sistemi ile kafeler listelenir
 */
const BrowseScreen = () => {
  const [allCafes, setAllCafes] = useState([]); // Tüm kafeler (filtrelenmemiş)
  const [displayedCafes, setDisplayedCafes] = useState([]); // Gösterilecek kafeler (filtrelenmiş + sıralanmış)
  const [loading, setLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);

  // Filtre state (modal içinde değiştirilir, uygulanana kadar listede değişiklik olmaz)
  const [activeFilters, setActiveFilters] = useState({
    restaurantTypes: [],
    maxDistance: 10, // km
    campaignTypes: [],
  });

  // Varsayılan konum (Ankara)
  const DEFAULT_LOCATION = {
    latitude: 39.9334,
    longitude: 32.8597,
  };

  // Component mount olduğunda konum izni kontrol et ve kafeleri yükle
  useEffect(() => {
    checkLocationAndLoadCafes();
  }, []);

  // AppState değişikliğini dinle (ayarlardan dönünce kontrol et)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        setTimeout(() => {
          checkLocationAndLoadCafes();
        }, 300);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription?.remove();
    };
  }, [appState]);

  // Sadece filtreler veya kafeler değiştiğinde listeyi güncelle
  // Arama sadece "Ara" butonuna basılınca yapılır
  useEffect(() => {
    applyFiltersAndSort();
  }, [allCafes, activeFilters, userLocation, hasSearched, searchQuery]);

  // Konum izni kontrolü ve kafeleri yükle
  const checkLocationAndLoadCafes = async () => {
    try {
      if (Platform.OS === 'web') {
        setUserLocation(DEFAULT_LOCATION);
        await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 15000,
        });
        if (location && location.coords) {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setUserLocation(coords);
          await loadCafes(coords.latitude, coords.longitude);
        } else {
          setUserLocation(DEFAULT_LOCATION);
          await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
        }
      } else {
        setUserLocation(DEFAULT_LOCATION);
        await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
      }
    } catch (error) {
      console.error('Location check error:', error);
      setUserLocation(DEFAULT_LOCATION);
      await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
    }
  };

  // Kafeleri yükle
  const loadCafes = async (latitude, longitude) => {
    setLoading(true);
    try {
      const response = await getNearbyCafes(latitude, longitude);
      if (response && response.success && response.data) {
        setAllCafes(response.data || []);
      } else {
        // Mock data kullan
        const { mockNearbyCafes } = require('../../utils/mockData');
        const mockCafes = mockNearbyCafes(latitude, longitude);
        setAllCafes(mockCafes || []);
      }
    } catch (error) {
      console.error('Error loading cafes:', error);
      // Hata durumunda da mock data kullan
      const { mockNearbyCafes } = require('../../utils/mockData');
      const mockCafes = mockNearbyCafes(latitude, longitude);
      setAllCafes(mockCafes || []);
    } finally {
      setLoading(false);
    }
  };

  // Filtreleri uygula ve sırala
  const applyFiltersAndSort = () => {
    let filtered = [...allCafes];

    // Arama sorgusu
    if (hasSearched && searchQuery.trim()) {
      filtered = filtered.filter(
        (cafe) =>
          (cafe.name || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          (cafe.address || '')
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Restoran Türü filtresi (çoklu seçim)
    if (
      activeFilters.restaurantTypes &&
      activeFilters.restaurantTypes.length > 0
    ) {
      filtered = filtered.filter((cafe) =>
        activeFilters.restaurantTypes.includes(cafe.restaurantType)
      );
    }

    // Mesafe filtresi
    if (activeFilters.maxDistance && activeFilters.maxDistance < 50) {
      const userLat = userLocation?.latitude || DEFAULT_LOCATION.latitude;
      const userLon = userLocation?.longitude || DEFAULT_LOCATION.longitude;
      filtered = filtered.filter((cafe) => {
        if (!cafe.latitude || !cafe.longitude) return false;
        const distance = require('../../utils/distanceUtils').calculateDistance(
          userLat,
          userLon,
          cafe.latitude,
          cafe.longitude
        );
        return distance <= activeFilters.maxDistance;
      });
    }

    // Kampanya Tipi filtresi (çoklu seçim)
    if (
      activeFilters.campaignTypes &&
      activeFilters.campaignTypes.length > 0
    ) {
      filtered = filtered.filter((cafe) => {
        if (!cafe.hasCampaign) return false;
        // Mock: hasCampaign true ise tüm kampanya tiplerini kabul et
        // Gerçek uygulamada cafe.campaignTypes array'i olabilir
        return true;
      });
    }

    // Mesafeye göre sırala
    const userLat = userLocation?.latitude || DEFAULT_LOCATION.latitude;
    const userLon = userLocation?.longitude || DEFAULT_LOCATION.longitude;
    const sorted = sortCafesByDistance(filtered, userLat, userLon);

    setDisplayedCafes(sorted);
    setCurrentPage(1); // Filtre uygulanınca ilk sayfaya dön
  };

  // Arama yap - butona basılınca çalışır
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setHasSearched(false);
      // Arama temizlendiğinde filtreleri uygula
      applyFiltersAndSort();
    } else {
      setHasSearched(true);
      // Arama yapıldığında filtreleri uygula
      applyFiltersAndSort();
    }
  };

  // Filtre modal'dan gelen filtreleri uygula
  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    // applyFiltersAndSort useEffect ile otomatik çağrılacak
  };

  // Kafe item render
  const renderCafeItem = ({ item }) => (
    <View style={styles.cafeItem}>
      <Text style={styles.cafeName}>{item.name || 'Kafe Adı'}</Text>
      {item.address && <Text style={styles.cafeAddress}>{item.address}</Text>}
      {item.distance !== undefined && (
        <Text style={styles.cafeDistance}>
          {item.distance.toFixed(2)} km uzaklıkta
        </Text>
      )}
      {item.restaurantType && (
        <Text style={styles.cafeType}>{item.restaurantType}</Text>
      )}
    </View>
  );

  // Pagination için gösterilecek veriler
  const paginatedData = displayedCafes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Aktif filtre sayısı
  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.restaurantTypes?.length > 0) count++;
    if (activeFilters.maxDistance !== 10) count++;
    if (activeFilters.campaignTypes?.length > 0) count++;
    return count;
  };

  return (
    <View style={styles.container}>
      {/* Arama ve Filtre Butonu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Input
            placeholder="Kafe ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            editable={true}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Ara</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterToggleButtonText}>
            Filtrele{getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      <ScrollView style={styles.scrollView}>
        {/* Sonuçlar */}
        <View style={styles.resultsContainer}>
          <View style={styles.listTitleContainer}>
            <Text style={styles.listTitle}>
              {hasSearched
                ? `Arama Sonuçları (${displayedCafes.length})`
                : `Yakındaki Kafeler (${displayedCafes.length})`}
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Yükleniyor...</Text>
            </View>
          ) : displayedCafes.length === 0 ? (
            <Text style={styles.emptyText}>
              {hasSearched
                ? 'Arama sonucu bulunamadı.'
                : 'Yakınınızda kafe bulunamadı.'}
            </Text>
          ) : (
            <View style={styles.cafeListContainer}>
              <FlatList
                data={paginatedData}
                renderItem={renderCafeItem}
                keyExtractor={(item, index) => `cafe-${item.id || index}`}
                scrollEnabled={false}
              />
              {/* Pagination */}
              {displayedCafes.length > itemsPerPage && (
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
                    Sayfa {currentPage} /{' '}
                    {Math.ceil(displayedCafes.length / itemsPerPage)}
                  </Text>
                  <View style={styles.itemsPerPageContainer}>
                    <Text style={styles.itemsPerPageLabel}>Göster:</Text>
                    {[5, 10, 20, 50].map((num) => (
                      <TouchableOpacity
                        key={num}
                        style={[
                          styles.itemsPerPageButton,
                          itemsPerPage === num &&
                            styles.itemsPerPageButtonActive,
                        ]}
                        onPress={() => {
                          setItemsPerPage(num);
                          setCurrentPage(1);
                        }}
                      >
                        <Text
                          style={[
                            styles.itemsPerPageText,
                            itemsPerPage === num &&
                              styles.itemsPerPageTextActive,
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
                      currentPage ===
                        Math.ceil(displayedCafes.length / itemsPerPage) &&
                        styles.pageButtonDisabled,
                    ]}
                    onPress={() => setCurrentPage(currentPage + 1)}
                    disabled={
                      currentPage ===
                      Math.ceil(displayedCafes.length / itemsPerPage)
                    }
                  >
                    <Text style={styles.pageButtonText}>Sonraki</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Harita - Filtrelenmiş kafeler harita üzerinde gösterilecek */}
        <View style={styles.mapContainer}>
          <BrowseMapScreen cafes={displayedCafes} userLocation={userLocation} />
        </View>
      </ScrollView>

      {/* Filtre Modal */}
      <BrowseFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
      />
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
  scrollView: {
    flex: 1,
  },
  resultsContainer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: spacing.sm,
    ...shadows.small,
  },
  listTitleContainer: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
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
  cafeListContainer: {
    marginTop: spacing.sm,
  },
  cafeItem: {
    backgroundColor: colors.background,
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
    marginBottom: spacing.xs,
  },
  cafeType: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexWrap: 'wrap',
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
    marginHorizontal: spacing.sm,
  },
  itemsPerPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
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
  mapContainer: {
    height: 400,
    margin: spacing.md,
    marginTop: spacing.sm,
  },
});

export default BrowseScreen;
