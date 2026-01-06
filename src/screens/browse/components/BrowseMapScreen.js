import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  AppState,
} from 'react-native';
import * as Location from 'expo-location';
import { getNearbyCafes } from '../../../services/cafeService';
import { colors, spacing, typography } from '../../../theme';

// Conditional import for react-native-maps
let MapView, Marker, Callout, PROVIDER_GOOGLE;
let mapsLoaded = false;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Callout = Maps.Callout;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    mapsLoaded = true;
  } catch (error) {
    console.warn('react-native-maps could not be loaded:', error);
  }
}

/**
 * BrowseMapScreen Component
 * Gerçek Google Maps haritası ile Lucky Table kafelerini gösterir
 * @param {Array} cafes - Gösterilecek kafe listesi (filtrelenmiş)
 * @param {Object} userLocation - Kullanıcı konumu {latitude, longitude}
 */
const BrowseMapScreen = ({ cafes: propCafes = [], userLocation: propUserLocation = null }) => {
  const [locationPermission, setLocationPermission] = useState(null);
  const [userLocation, setUserLocation] = useState(propUserLocation);
  const [mapRegion, setMapRegion] = useState(null);
  const [cafes, setCafes] = useState(propCafes);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  // Varsayılan konum (İstanbul)
  const DEFAULT_LOCATION = {
    latitude: 41.0082,
    longitude: 28.9784,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Props değiştiğinde state'i güncelle
  useEffect(() => {
    if (propCafes) {
      setCafes(propCafes);
    }
    if (propUserLocation) {
      setUserLocation(propUserLocation);
    }
  }, [propCafes, propUserLocation]);

  // Component mount olduğunda konum izni kontrol et
  useEffect(() => {
    if (!propUserLocation) {
      checkLocationPermission();
    } else {
      // Prop'tan gelen konum varsa direkt kullan
      const region = {
        ...propUserLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      setMapRegion(region);
      setLoading(false);
    }
  }, []);

  // AppState değişikliğini dinle (ayarlardan dönünce kontrol et)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // Ayarlardan dönünce permission'ı yeniden kontrol et
        setTimeout(() => {
          checkLocationPermission();
        }, 300);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription?.remove();
    };
  }, [appState]);

  // Konum izni kontrolü
  const checkLocationPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        setLocationPermission(false);
        setMapRegion(DEFAULT_LOCATION);
        await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
        setLoading(false);
        return;
      }

      // Mevcut izin durumunu kontrol et
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationPermission(true);
        await getCurrentLocation();
      } else {
        setLocationPermission(false);
        // İzin yoksa varsayılan konuma odaklan
        setMapRegion(DEFAULT_LOCATION);
        await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
        setLoading(false);
      }
    } catch (error) {
      console.error('Location permission check error:', error);
      setLocationPermission(false);
      setMapRegion(DEFAULT_LOCATION);
      await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
      setLoading(false);
    }
  };

  // Mevcut konumu al
  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
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

        // Harita bölgesini ayarla
        const region = {
          ...coords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };

        setMapRegion(region);
        await loadCafes(coords.latitude, coords.longitude);
      } else {
        // Konum alınamazsa varsayılan konuma odaklan
        setMapRegion(DEFAULT_LOCATION);
        await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
      }
    } catch (error) {
      console.error('Get location error:', error);
      // Hata durumunda varsayılan konuma odaklan
      setMapRegion(DEFAULT_LOCATION);
      await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
    } finally {
      setLoading(false);
    }
  };

  // Kafeleri yükle (sadece prop'tan gelmemişse)
  const loadCafes = async (latitude, longitude) => {
    if (propCafes && propCafes.length > 0) {
      // Prop'tan gelen kafeler varsa kullan
      setCafes(propCafes);
      return;
    }
    try {
      const response = await getNearbyCafes(latitude, longitude);
      if (response && response.success && response.data) {
        setCafes(response.data);
      } else {
        setCafes([]);
      }
    } catch (error) {
      console.error('Error loading cafes:', error);
      setCafes([]);
    }
  };

  // Web için fallback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webMapContainer}>
          <Text style={styles.webMapText}>🗺️ Google Maps</Text>
          <Text style={styles.webMapInfo}>
            Harita özelliği mobil cihazlarda kullanılabilir.
          </Text>
          {cafes.length > 0 && (
            <Text style={styles.cafesCount}>
              {cafes.length} kafe bulundu
            </Text>
          )}
        </View>
      </View>
    );
  }

  // Maps yüklenmemişse
  if (!mapsLoaded || !MapView) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Harita yükleniyor...</Text>
        </View>
      </View>
    );
  }

  // Region yüklenmemişse
  if (!mapRegion) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Konum alınıyor...</Text>
        </View>
      </View>
    );
  }

  // Harita render
  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={mapRegion}
        region={mapRegion}
        showsUserLocation={locationPermission === true}
        showsMyLocationButton={locationPermission === true}
        mapType="standard"
        onRegionChangeComplete={(newRegion) => {
          if (newRegion && newRegion.latitude && newRegion.longitude) {
            setMapRegion(newRegion);
          }
        }}
        onError={(error) => {
          console.error('MapView error:', error);
        }}
        onMapReady={() => {
          console.log('Google Maps is ready');
        }}
        loadingEnabled={true}
        loadingIndicatorColor={colors.primary}
      >
        {/* Kafe Marker'ları */}
        {cafes.map((cafe) => {
          if (!cafe.latitude || !cafe.longitude) return null;

          return (
            <Marker
              key={`cafe-${cafe.id}`}
              coordinate={{
                latitude: cafe.latitude,
                longitude: cafe.longitude,
              }}
              title={cafe.name || 'Kafe'}
              description={cafe.address || ''}
              pinColor={colors.primary}
            >
              <Callout>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{cafe.name || 'Kafe'}</Text>
                  {cafe.address && (
                    <Text style={styles.calloutAddress}>{cafe.address}</Text>
                  )}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
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
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calloutContainer: {
    width: 200,
    padding: spacing.sm,
  },
  calloutTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  calloutAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  webMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  webMapText: {
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.sm,
  },
  webMapInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  cafesCount: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginTop: spacing.md,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default BrowseMapScreen;

