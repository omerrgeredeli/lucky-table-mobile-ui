import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  Switch,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { getNearbyCafes } from '../../services/cafeService';
import { colors, spacing, typography, shadows } from '../../theme';
import Logo from '../../components/Logo';
import BrowseMapScreen from './components/BrowseMapScreen';
import BrowseFilterModal from './components/BrowseFilterModal';
import Input from '../../components/Input';
import { sortCafesByDistance } from '../../utils/distanceUtils';

/**
 * Browse Screen - Göz At
 * Sahibinden.com benzeri filtreleme sistemi ile kafeler listelenir
 */
const BrowseScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();
  const [allCafes, setAllCafes] = useState([]); // Tüm kafeler (filtrelenmemiş)
  const [displayedCafes, setDisplayedCafes] = useState([]); // Gösterilecek kafeler (filtrelenmiş + sıralanmış)
  const [loading, setLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState(route.params?.searchQuery || '');
  const [hasSearched, setHasSearched] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [showOnlyOpen, setShowOnlyOpen] = useState(true); // "Şu anda açık olanlar" switch - default açık
  const scrollViewRef = useRef(null);
  const mapContainerRef = useRef(null);

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

  // Route params değiştiğinde arama yap
  useEffect(() => {
    if (route.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
      setHasSearched(true);
      // Arama otomatik olarak applyFiltersAndSort içinde yapılacak
    }
  }, [route.params?.searchQuery]);

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
  }, [allCafes, activeFilters, userLocation, hasSearched, searchQuery, showOnlyOpen]);

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

    // "Şu anda açık olanlar" filtresi
    if (showOnlyOpen) {
      filtered = filtered.filter((cafe) => {
        // Mock: isOpen property'si varsa kullan, yoksa varsayılan olarak true kabul et
        // Gerçek kullanımda backend'den gelen isOpen veya openingHours'a göre hesaplanacak
        return cafe.isOpen !== false; // undefined veya true ise açık kabul et
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

  // Haritaya scroll yap
  const scrollToMap = () => {
    if (scrollViewRef.current && mapContainerRef.current) {
      // Harita container'ının pozisyonunu ölç
      mapContainerRef.current.measureLayout(
        scrollViewRef.current,
        (x, y) => {
          // Smooth scroll ile haritaya git
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, y - spacing.md), // Biraz üstten başlasın
            animated: true,
          });
        },
        () => {
          // Fallback: measureLayout başarısız olursa scrollToEnd kullan
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }
      );
    }
  };

  // Kafe item render
  const renderCafeItem = ({ item }) => {
    const isClosed = item.isOpen === false;
    const openingHours = item.openingHours || { open: '08:00', close: '22:00' };
    const hoursText = `${openingHours.open} - ${openingHours.close}`;

    return (
      <View style={[styles.cafeItem, isClosed && !showOnlyOpen && styles.cafeItemClosed]}>
        <View style={styles.cafeItemContent}>
          {/* Logo - HomeScreen ile BİREBİR aynı */}
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
                {(item.name || 'Kafe')[0].toUpperCase()}
              </Text>
            </View>
          )}

          {/* Orta kısım - Kafe bilgileri */}
          <View style={styles.cafeInfoContainer}>
            <Text style={[styles.cafeName, isClosed && !showOnlyOpen && styles.cafeNameClosed]}>
              {item.name || t('browse.cafeName')}
            </Text>
            {item.address && (
              <Text style={[styles.cafeAddress, isClosed && !showOnlyOpen && styles.cafeAddressClosed]}>
                {item.address}
              </Text>
            )}
      {item.distance !== undefined && (
              <Text style={[styles.cafeDistance, isClosed && !showOnlyOpen && styles.cafeDistanceClosed]}>
          {item.distance.toFixed(2)} {t('browse.kmAway')}
        </Text>
      )}
      {item.restaurantType && (
              <Text style={[styles.cafeType, isClosed && !showOnlyOpen && styles.cafeTypeClosed]}>
                {item.restaurantType}
              </Text>
      )}
          </View>

          {/* Sağ taraf - Açılış/Kapanış saatleri */}
          <View style={styles.cafeHoursContainer}>
            <Text style={[styles.cafeHours, isClosed && !showOnlyOpen && styles.cafeHoursClosed]}>
              {hoursText}
            </Text>
          </View>
        </View>
    </View>
  );
  };

  // Pagination için gösterilecek veriler
  const paginatedData = displayedCafes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Total pages hesaplama - LoyaltyDetailsScreen ile aynı mantık
  const totalPages = displayedCafes.length > 0 ? Math.max(1, Math.ceil(displayedCafes.length / itemsPerPage)) : 0;
  
  // itemsPerPage değişince sayfa numarasını kontrol et (LoyaltyDetailsScreen'den)
  useEffect(() => {
    const newTotalPages = displayedCafes.length > 0 ? Math.max(1, Math.ceil(displayedCafes.length / itemsPerPage)) : 0;
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    } else if (newTotalPages === 0 && currentPage > 1) {
      setCurrentPage(1);
    }
  }, [itemsPerPage, displayedCafes.length]);

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
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Logo size="small" />
      </View>

      {/* Arama ve Filtre Butonu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Input
            placeholder={t('browse.searchPlaceholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            editable={true}
            onSubmitEditing={handleSearch}
          />
        </View>
        <TouchableOpacity 
          style={styles.searchButton} 
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>{t('browse.search')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Text style={styles.filterToggleButtonText}>
            {t('browse.filter')}{getActiveFilterCount() > 0 && ` (${getActiveFilterCount()})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
      >
        {/* Sonuçlar */}
        <View style={styles.resultsContainer}>
          <View style={styles.listTitleContainer}>
            <Text style={styles.listTitle}>
              {hasSearched
                ? `${t('browse.searchResults')} (${displayedCafes.length})`
                : `${t('browse.nearbyCafes')} (${displayedCafes.length})`}
            </Text>
            {/* "Şu anda açık olanlar" Switch */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>{t('browse.showOnlyOpen')}</Text>
              <Switch
                value={showOnlyOpen}
                onValueChange={setShowOnlyOpen}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>{t('browse.loading')}</Text>
            </View>
          ) : displayedCafes.length === 0 ? (
            <Text style={styles.emptyText}>
              {hasSearched
                ? t('browse.noSearchResults')
                : t('browse.noNearbyCafes')}
            </Text>
          ) : (
            <View style={styles.cafeListContainer}>
              <FlatList
                data={paginatedData}
                renderItem={renderCafeItem}
                keyExtractor={(item, index) => `cafe-${item.id || index}`}
                scrollEnabled={false}
              />
              {/* Pagination - LoyaltyDetailsScreen ile aynı görünürlük kontrolü */}
              {displayedCafes.length > 0 && totalPages > 0 && (
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
                      currentPage === totalPages &&
                        styles.pageButtonDisabled,
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
        </View>

        {/* Harita - Filtrelenmiş kafeler harita üzerinde gösterilecek */}
        <View ref={mapContainerRef} style={styles.mapContainer}>
          <BrowseMapScreen cafes={displayedCafes} userLocation={userLocation} />
        </View>
      </ScrollView>

      {/* Floating Harita Iconu - Sağ Alt Köşe */}
      <TouchableOpacity
        style={styles.floatingMapButton}
        onPress={scrollToMap}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingMapIcon}>🗺️</Text>
      </TouchableOpacity>

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
  logoContainer: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center', // Dikey hizalama için
  },
  searchInputContainer: {
    flex: 1,
    marginRight: spacing.sm,
    height: 44, // Sabit yükseklik - butonlarla aynı hizada olması için (padding dahil)
    justifyContent: 'center', // İçeriği dikey olarak ortala
  },
  searchInput: {
    backgroundColor: colors.background,
    height: 44, // Input yüksekliği butonlarla aynı
    paddingVertical: spacing.xs + 2, // Üst-alt padding eşit
    paddingHorizontal: spacing.md,
    margin: 0, // Margin sıfırla
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    fontSize: typography.fontSize.md,
  },
  searchButton: {
    height: 44, // Buton yüksekliği input ile aynı
    paddingVertical: 0, // Padding sıfırla, height ile kontrol et
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: spacing.sm,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center', // İçeriği dikey olarak ortala
    marginRight: spacing.sm,
  },
  searchButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  filterToggleButton: {
    height: 44, // Buton yüksekliği input ile aynı
    paddingVertical: 0, // Padding sıfırla, height ile kontrol et
    paddingHorizontal: spacing.md,
    backgroundColor: colors.secondary || colors.primary,
    borderRadius: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center', // İçeriği dikey olarak ortala
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  switchLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.xs,
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
    overflow: 'visible', // Logo görünürlüğü için
    ...shadows.small,
  },
  cafeItemClosed: {
    opacity: 0.5, // Kapalı kafeler daha sönük
  },
  cafeItemContent: {
    flexDirection: 'row',
    alignItems: 'center', // HomeScreen cafeHeader ile aynı
    overflow: 'visible', // Logo görünürlüğü için
  },
  cafeLogo: {
    width: 40,
    height: 40,
    borderRadius: spacing.xs,
    marginRight: spacing.sm,
  },
  cafeLogoPlaceholder: {
    backgroundColor: colors.primary, // HomeScreen ile BİREBİR aynı
    justifyContent: 'center', // HomeScreen ile BİREBİR aynı
    alignItems: 'center', // HomeScreen ile BİREBİR aynı
  },
  cafeLogoPlaceholderText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  cafeInfoContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  cafeName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  cafeNameClosed: {
    color: colors.textSecondary,
  },
  cafeAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cafeAddressClosed: {
    opacity: 0.7,
  },
  cafeDistance: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  cafeDistanceClosed: {
    opacity: 0.7,
  },
  cafeType: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  cafeTypeClosed: {
    opacity: 0.7,
  },
  cafeHoursContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  cafeHours: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  cafeHoursClosed: {
    opacity: 0.7,
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
  floatingMapButton: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
    elevation: 5, // Android için shadow
    zIndex: 1000,
  },
  floatingMapIcon: {
    fontSize: 24,
  },
});

export default BrowseScreen;
