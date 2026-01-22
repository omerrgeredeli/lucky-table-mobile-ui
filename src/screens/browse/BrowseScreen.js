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
import { sortCafesByDistance, calculateDistance } from '../../utils/distanceUtils';

const DEFAULT_LOCATION = {
  latitude: 39.9334,
  longitude: 32.8597,
};

const BrowseScreen = () => {
  const { t } = useTranslation();
  const route = useRoute();

  const scrollViewRef = useRef(null);
  const mapContainerRef = useRef(null);

  const [allCafes, setAllCafes] = useState([]);
  const [displayedCafes, setDisplayedCafes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState(route.params?.searchQuery || '');
  const [hasSearched, setHasSearched] = useState(false);

  const [userLocation, setUserLocation] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showOnlyOpen, setShowOnlyOpen] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [activeFilters, setActiveFilters] = useState({
    restaurantTypes: [],
    maxDistance: 10,
    campaignTypes: [],
  });

  /* -------------------------------------------------- */
  /* LOCATION & DATA LOAD                               */
  /* -------------------------------------------------- */

  useEffect(() => {
    checkLocationAndLoadCafes();
  }, []);

  useEffect(() => {
    if (route.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
      setHasSearched(true);
    }
  }, [route.params?.searchQuery]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = AppState.addEventListener('change', (next) => {
      if (appState.match(/inactive|background/) && next === 'active') {
        setTimeout(checkLocationAndLoadCafes, 300);
      }
      setAppState(next);
    });

    return () => sub.remove();
  }, [appState]);

  const checkLocationAndLoadCafes = async () => {
    try {
      if (Platform.OS === 'web') {
        setUserLocation(DEFAULT_LOCATION);
        await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 15000,
        });

        const coords = loc?.coords
          ? { latitude: loc.coords.latitude, longitude: loc.coords.longitude }
          : DEFAULT_LOCATION;

        setUserLocation(coords);
        await loadCafes(coords.latitude, coords.longitude);
      } else {
        setUserLocation(DEFAULT_LOCATION);
        await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
      }
    } catch (e) {
      console.error('Location error:', e);
      setUserLocation(DEFAULT_LOCATION);
      await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
    }
  };

  const loadCafes = async (lat, lng) => {
    setLoading(true);
    try {
      const data = await getNearbyCafes(lat, lng);

      if (!Array.isArray(data)) {
        throw new Error('Invalid cafe data');
      }

      setAllCafes(data);
    } catch (e) {
      console.error('Cafe load error:', e);
      const { mockNearbyCafes } = require('../../utils/mockData');
      setAllCafes(mockNearbyCafes(lat, lng));
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------- */
  /* FILTER & SORT                                      */
  /* -------------------------------------------------- */

  useEffect(() => {
    applyFiltersAndSort();
  }, [allCafes, activeFilters, hasSearched, searchQuery, userLocation, showOnlyOpen]);

  const applyFiltersAndSort = () => {
    let list = [...allCafes];

    if (hasSearched && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        c =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.address || '').toLowerCase().includes(q)
      );
    }

    if (activeFilters.restaurantTypes.length > 0) {
      list = list.filter(c =>
        activeFilters.restaurantTypes.includes(c.restaurantType)
      );
    }

    if (activeFilters.maxDistance < 50) {
      const ulat = userLocation?.latitude ?? DEFAULT_LOCATION.latitude;
      const ulng = userLocation?.longitude ?? DEFAULT_LOCATION.longitude;

      list = list.filter(c => {
        if (!c.latitude || !c.longitude) return false;
        const d = calculateDistance(ulat, ulng, c.latitude, c.longitude);
        return d <= activeFilters.maxDistance;
      });
    }

    if (activeFilters.campaignTypes.length > 0) {
      list = list.filter(c => c.hasCampaign);
    }

    if (showOnlyOpen) {
      list = list.filter(c => c.isOpen !== false);
    }

    const ulat = userLocation?.latitude ?? DEFAULT_LOCATION.latitude;
    const ulng = userLocation?.longitude ?? DEFAULT_LOCATION.longitude;

    setDisplayedCafes(sortCafesByDistance(list, ulat, ulng));
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setHasSearched(!!searchQuery.trim());
  };

  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
  };

  /* -------------------------------------------------- */
  /* PAGINATION                                         */
  /* -------------------------------------------------- */

  const paginatedData = displayedCafes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages =
    displayedCafes.length > 0
      ? Math.max(1, Math.ceil(displayedCafes.length / itemsPerPage))
      : 0;

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

  /* -------------------------------------------------- */
  /* UI                                                 */
  /* -------------------------------------------------- */

  const scrollToMap = () => {
    mapContainerRef.current?.measureLayout(
      scrollViewRef.current,
      (_, y) => scrollViewRef.current.scrollTo({ y, animated: true }),
      () => scrollViewRef.current.scrollToEnd({ animated: true })
    );
  };

  const renderCafeItem = ({ item }) => {
    const isClosed = item.isOpen === false;
    const openingHours = item.openingHours || { open: '08:00', close: '22:00' };
    const hoursText = `${openingHours.open} - ${openingHours.close}`;

    return (
      <View style={[styles.cafeItem, isClosed && !showOnlyOpen && styles.cafeItemClosed]}>
        <View style={styles.cafeItemContent}>
          {/* Logo */}
          {item.cafeLogo ? (
            <Image
              source={{ uri: item.cafeLogo }}
              style={styles.cafeLogo}
              onError={() => {}}
            />
          ) : (
            <View style={[styles.cafeLogo, styles.cafeLogoPlaceholder]}>
              <Text style={styles.cafeLogoPlaceholderText}>
                {(item.name || 'Kafe')[0].toUpperCase()}
              </Text>
            </View>
          )}

          {/* Kafe bilgileri */}
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

          {/* Açılış/Kapanış saatleri */}
          <View style={styles.cafeHoursContainer}>
            <View style={styles.hoursRow}>
              <View style={styles.hoursColumn}>
                <Text style={[styles.hoursLabel, isClosed && !showOnlyOpen && styles.hoursLabelClosed]}>
                  {t('browse.opening')}
                </Text>
                <Text style={[styles.hoursTime, isClosed && !showOnlyOpen && styles.hoursTimeClosed]}>
                  {openingHours.open}
                </Text>
              </View>
              <View style={styles.hoursSeparator} />
              <View style={styles.hoursColumn}>
                <Text style={[styles.hoursLabel, isClosed && !showOnlyOpen && styles.hoursLabelClosed]}>
                  {t('browse.closing')}
                </Text>
                <Text style={[styles.hoursTime, isClosed && !showOnlyOpen && styles.hoursTimeClosed]}>
                  {openingHours.close}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
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
              {/* Pagination */}
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

export default BrowseScreen;

/* -------------------------------------------------- */
/* STYLES                                             */
/* -------------------------------------------------- */

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
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    marginRight: spacing.sm,
    height: 44,
    justifyContent: 'center',
  },
  searchInput: {
    backgroundColor: colors.background,
    height: 44,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    margin: 0,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: spacing.sm,
    fontSize: typography.fontSize.md,
  },
  searchButton: {
    height: 44,
    paddingVertical: 0,
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
    height: 44,
    paddingVertical: 0,
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
  emptyText: {
    padding: spacing.xl,
    textAlign: 'center',
    fontSize: typography.fontSize.md,
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
    overflow: 'visible',
    ...shadows.small,
  },
  cafeItemClosed: {
    opacity: 0.5,
  },
  cafeItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'visible',
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
    color: colors.textSecondary,
  },
  cafeDistance: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  cafeDistanceClosed: {
    color: colors.textSecondary,
  },
  cafeType: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  cafeTypeClosed: {
    color: colors.textSecondary,
  },
  cafeHoursContainer: {
    alignItems: 'flex-end',
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursColumn: {
    alignItems: 'center',
  },
  hoursSeparator: {
    width: 1,
    height: 20,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  hoursLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  hoursLabelClosed: {
    color: colors.textSecondary,
  },
  hoursTime: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
  },
  hoursTimeClosed: {
    color: colors.textSecondary,
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
    minWidth: 80,
    alignItems: 'center',
  },
  pageButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  pageInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  itemsPerPageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  itemsPerPageLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  itemsPerPageButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemsPerPageButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemsPerPageText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  itemsPerPageTextActive: {
    color: colors.white,
    fontWeight: typography.fontWeight.semibold,
  },
  mapContainer: {
    height: 400,
    margin: spacing.md,
    borderRadius: spacing.sm,
    overflow: 'hidden',
    ...shadows.small,
  },
  floatingMapButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  floatingMapIcon: {
    fontSize: 24,
  },
});
