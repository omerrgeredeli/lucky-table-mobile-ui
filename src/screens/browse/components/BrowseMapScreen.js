import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  AppState,
  TouchableOpacity,
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
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(null); // Location servisleri (GPS) açık mı?
  const [userLocation, setUserLocation] = useState(propUserLocation);
  const [mapRegion, setMapRegion] = useState(null);
  const [cafes, setCafes] = useState(propCafes);
  const [loading, setLoading] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);

  // Varsayılan konum (Ankara)
  const DEFAULT_LOCATION = {
    latitude: 39.9334,
    longitude: 32.8597,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  // Props değiştiğinde state'i güncelle - filtreleme sonrası kafeler güncellenmeli
  useEffect(() => {
    if (propCafes && Array.isArray(propCafes)) {
      console.log('BrowseMapScreen: propCafes updated', propCafes.length);
      setCafes(propCafes);
      // Kafeler yüklendiğinde region'ı güncelle (sadece kafeler varsa)
      if (propCafes.length > 0) {
        updateMapRegionForCafes(propCafes);
      }
    }
    if (propUserLocation) {
      setUserLocation(propUserLocation);
    }
  }, [propCafes, propUserLocation]);

  // Kafeler değiştiğinde region'ı güncelle ve debug log ekle
  useEffect(() => {
    if (cafes && cafes.length > 0) {
      console.log('BrowseMapScreen: cafes state updated', cafes.length);
      const validCafes = cafes.filter(cafe => {
        const lat = Number(cafe.latitude);
        const lng = Number(cafe.longitude);
        return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
      });
      console.log('BrowseMapScreen: valid cafes for markers', validCafes.length);
      updateMapRegionForCafes(cafes);
    } else {
      console.log('BrowseMapScreen: cafes state is empty');
    }
  }, [cafes]);

  // Map region'ı kafeleri kapsayacak şekilde güncelle
  const updateMapRegionForCafes = (cafeList) => {
    if (!cafeList || cafeList.length === 0) {
      console.log('BrowseMapScreen: updateMapRegionForCafes - empty cafe list');
      return;
    }

    const validCafes = cafeList.filter(cafe => {
      const lat = Number(cafe.latitude);
      const lng = Number(cafe.longitude);
      // Düzeltme: lat == null veya lng == null kontrolü (0 değerleri geçerli değil ama kontrol yanlıştı)
      return lat != null && lng != null &&
        !isNaN(lat) && !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180;
    });

    console.log('BrowseMapScreen: valid cafes for region', validCafes.length, 'out of', cafeList.length);

    if (validCafes.length === 0) {
      console.warn('BrowseMapScreen: No valid cafes found for region update');
      return;
    }

    // Tüm kafelerin koordinatlarını al - Number() ile cast et
    const latitudes = validCafes.map(c => Number(c.latitude));
    const longitudes = validCafes.map(c => Number(c.longitude));

    // Min/max koordinatları bul
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    // Merkez noktası
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    // Delta değerleri (padding ekle)
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.05);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.05);

    setMapRegion({
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    });
  };

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

  // Location servislerinin açık olup olmadığını kontrol et (GPS)
  const checkLocationServices = async () => {
    try {
      if (Platform.OS === 'web') {
        setLocationServicesEnabled(true); // Web'de her zaman true
        return true;
      }
      
      const enabled = await Location.hasServicesEnabledAsync();
      setLocationServicesEnabled(enabled);
      return enabled;
    } catch (error) {
      console.error('Location services check error:', error);
      setLocationServicesEnabled(false);
      return false;
    }
  };

  // Konum izni kontrolü
  const checkLocationPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        setLocationPermission(false);
        setLocationServicesEnabled(true);
        setMapRegion(DEFAULT_LOCATION);
        await loadCafes(DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude);
        setLoading(false);
        return;
      }

      // Önce location servislerinin açık olup olmadığını kontrol et
      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
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

  // Kafeleri yükle (sadece prop'tan gelmemişse veya boşsa)
  const loadCafes = async (latitude, longitude) => {
    // Prop'tan gelen kafeler varsa (boş array bile olsa) kullan
    if (propCafes && Array.isArray(propCafes)) {
      console.log('BrowseMapScreen: Using propCafes', propCafes.length);
      setCafes(propCafes);
      if (propCafes.length > 0) {
        updateMapRegionForCafes(propCafes);
      }
      return;
    }
    // Prop'tan gelen kafeler yoksa, API'den veya mock'tan yükle
    try {
      // Düzeltme: getNearbyCafes direkt array döndürüyor, response object değil
      const cafes = await getNearbyCafes(latitude, longitude);
      if (cafes && Array.isArray(cafes) && cafes.length > 0) {
        console.log('BrowseMapScreen: Loaded cafes from API', cafes.length);
        setCafes(cafes);
        updateMapRegionForCafes(cafes);
      } else {
        // Mock data kullan
        const { mockNearbyCafes } = require('../../../utils/mockData');
        const mockCafes = mockNearbyCafes(latitude, longitude);
        console.log('BrowseMapScreen: Using mock cafes', mockCafes.length);
        setCafes(mockCafes);
        updateMapRegionForCafes(mockCafes);
      }
    } catch (error) {
      console.error('Error loading cafes:', error);
      // Hata durumunda da mock data kullan
      const { mockNearbyCafes } = require('../../../utils/mockData');
      const mockCafes = mockNearbyCafes(latitude, longitude);
      console.log('BrowseMapScreen: Using mock cafes (error fallback)', mockCafes.length);
      setCafes(mockCafes);
      updateMapRegionForCafes(mockCafes);
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

  // Location servisleri kapalıysa MapView render etme
  if (locationServicesEnabled === false) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Konum servisleri kapalı. Haritayı görmek için ayarlardan konum servislerini açın.
          </Text>
        </View>
      </View>
    );
  }

  // MapView render edilmeden önce tüm kontrolleri yap (Android crash önleme)
  const canRenderMap = MapView && 
                       mapsLoaded && 
                       typeof MapView !== 'undefined' && 
                       PROVIDER_GOOGLE && 
                       mapRegion && 
                       mapRegion.latitude != null && 
                       mapRegion.longitude != null &&
                       !isNaN(mapRegion.latitude) &&
                       !isNaN(mapRegion.longitude) &&
                       locationServicesEnabled !== false; // Location servisleri açık olmalı

  // Debug: Marker render bilgisi
  const validCafesForMarkers = cafes && cafes.length > 0 ? cafes.filter(cafe => {
    const lat = Number(cafe.latitude);
    const lng = Number(cafe.longitude);
    return lat != null && lng != null && !isNaN(lat) && !isNaN(lng) &&
           lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }) : [];
  
  if (canRenderMap && cafes && cafes.length > 0) {
    console.log('BrowseMapScreen: Ready to render map with', validCafesForMarkers.length, 'valid markers out of', cafes.length, 'cafes');
  }

  // Harita render
  return (
    <View style={styles.container}>
      {canRenderMap ? (
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
          region={mapRegion}
          showsUserLocation={locationPermission === true && locationServicesEnabled === true}
          showsMyLocationButton={locationPermission === true && locationServicesEnabled === true}
          showsCompass={true}
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
          // Android crash önleme: minZoomLevel ve maxZoomLevel ekle
          minZoomLevel={10}
          maxZoomLevel={20}
          // Android için ek güvenlik
          moveOnMarkerPress={false}
          pitchEnabled={false}
          rotateEnabled={false}
        >
        {/* Kafe Marker'ları - Filtrelenmiş kafeler */}
        {cafes && cafes.length > 0 && cafes.map((cafe, index) => {
          // Latitude ve longitude Number() ile cast et
          const lat = Number(cafe.latitude);
          const lng = Number(cafe.longitude);
          
          // Geçersizse marker render etme - Düzeltme: lat == null veya lng == null kontrolü
          if (lat == null || lng == null || 
              isNaN(lat) || isNaN(lng) ||
              lat < -90 || lat > 90 ||
              lng < -180 || lng > 180) {
            console.warn('BrowseMapScreen: Invalid coordinates for cafe', cafe.id || index, 'lat:', lat, 'lng:', lng);
            return null;
          }

          return (
            <Marker
              key={`cafe-${cafe.id || index}`}
              coordinate={{
                latitude: lat,
                longitude: lng,
              }}
              title={cafe.name || 'Kafe'}
              description={cafe.address || ''}
              pinColor={colors.primary}
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={styles.markerLabelContainer}>
                <Text style={styles.markerLabel} numberOfLines={1}>
                  {cafe.name || 'Kafe'}
                </Text>
              </View>
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
      ) : (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Harita yükleniyor...</Text>
        </View>
      )}

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
  markerLabelContainer: {
    position: 'absolute',
    bottom: 30,
    left: -60,
    width: 120,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
});

export default BrowseMapScreen;

