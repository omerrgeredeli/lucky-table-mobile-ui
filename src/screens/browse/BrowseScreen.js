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
    const hours = item.openingHours || { open: '08:00', close: '22:00' };

    return (
      <View style={[styles.cafeItem, isClosed && styles.cafeItemClosed]}>
        <View style={styles.cafeItemContent}>
          {item.cafeLogo ? (
            <Image source={{ uri: item.cafeLogo }} style={styles.cafeLogo} />
          ) : (
            <View style={[styles.cafeLogo, styles.cafeLogoPlaceholder]}>
              <Text style={styles.cafeLogoPlaceholderText}>
                {(item.name || 'K')[0]}
              </Text>
            </View>
          )}

          <View style={styles.cafeInfoContainer}>
            <Text style={styles.cafeName}>{item.name}</Text>
            <Text style={styles.cafeAddress}>{item.address}</Text>
            <Text style={styles.cafeDistance}>
              {item.distance?.toFixed(2)} km
            </Text>
          </View>

          <View>
            <Text>{hours.open}</Text>
            <Text>{hours.close}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Logo size="small" />

      <View style={styles.searchContainer}>
        <Input
          placeholder={t('browse.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch}>
          <Text>{t('browse.search')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef}>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={paginatedData}
            renderItem={renderCafeItem}
            keyExtractor={(i) => String(i.id)}
            scrollEnabled={false}
          />
        )}

        <View ref={mapContainerRef} style={{ height: 400 }}>
          <BrowseMapScreen cafes={displayedCafes} userLocation={userLocation} />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.floatingMapButton} onPress={scrollToMap}>
        <Text style={{ fontSize: 24 }}>🗺️</Text>
      </TouchableOpacity>

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
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: { padding: spacing.md },
  cafeItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: spacing.sm,
    ...shadows.small,
  },
  cafeItemClosed: { opacity: 0.5 },
  cafeItemContent: { flexDirection: 'row', alignItems: 'center' },
  cafeLogo: { width: 40, height: 40, marginRight: spacing.sm },
  cafeLogoPlaceholder: {
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cafeLogoPlaceholderText: { color: colors.white },
  cafeInfoContainer: { flex: 1 },
  cafeName: { fontWeight: '600' },
  cafeAddress: { fontSize: 12 },
  cafeDistance: { fontSize: 12, color: colors.primary },
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
  },
});
