import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import * as Location from 'expo-location';
import { getNearbyCafes } from '../../../services/cafeService';
import { colors, spacing, typography, shadows } from '../../../theme';

// Web için MapView'i conditional import et - sadece native'de yükle
let MapView, Marker, Callout, PROVIDER_GOOGLE, PROVIDER_DEFAULT;
let mapsLoaded = false;

const loadMaps = async () => {
  if (Platform.OS === 'web' || mapsLoaded) {
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Callout = Maps.Callout;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
    mapsLoaded = true;
  } catch (error) {
    console.warn('react-native-maps could not be loaded:', error);
  }
};

/**
 * NearbyCafesMap Component - Micro-Screen Architecture
 * Yakındaki kafeleri gerçek harita üzerinde gösterir
 * Bu component tamamen bağımsızdır, kendi state'ini yönetir
 */
const NearbyCafesMap = () => {
  const [nearbyCafes, setNearbyCafes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [locationServicesEnabled, setLocationServicesEnabled] = useState(null); // Location servisleri (GPS) açık mı?
  const [userLocation, setUserLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [error, setError] = useState(null);
  const [mapsReady, setMapsReady] = useState(false);

  // Component mount olduğunda maps'i yükle ve konum izni iste
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        if (Platform.OS !== 'web') {
          await loadMaps();
          // Maps yüklendikten sonra kısa bir gecikme ekle (Android crash önleme)
          await new Promise(resolve => setTimeout(resolve, 100));
          setMapsReady(true);
        } else {
          setMapsReady(true);
        }
        // Konum izni iste
    requestLocationPermission();
      } catch (error) {
        console.error('Map initialization error:', error);
        setError('Harita yüklenirken bir hata oluştu.');
        setMapsReady(true); // Hata olsa bile ready yap ki fallback gösterilsin
        setLoading(false);
      }
    };
    initialize();
  }, []);

  // Kafeler değiştiğinde region'ı güncelle
  useEffect(() => {
    if (nearbyCafes && nearbyCafes.length > 0 && mapRegion) {
      console.log('NearbyCafesMap: cafes state updated, updating region', nearbyCafes.length);
      updateMapRegionForCafes(nearbyCafes);
    }
  }, [nearbyCafes, updateMapRegionForCafes]);

  // AppState değişikliğini dinle (ayarlardan dönünce konum iznini yeniden kontrol et)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    
    const { AppState } = require('react-native');
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && !locationPermission) {
        // Ayarlardan dönünce permission'ı yeniden kontrol et
        setTimeout(() => {
          requestLocationPermission();
        }, 500);
      }
    });
    
    return () => {
      subscription?.remove();
    };
  }, [locationPermission]);

  // Location servislerinin açık olup olmadığını kontrol et (GPS)
  const checkLocationServices = async () => {
    try {
      if (Platform.OS === 'web') {
        setLocationServicesEnabled(true); // Web'de her zaman true
        return true;
      }
      
      const enabled = await Location.hasServicesEnabledAsync();
      setLocationServicesEnabled(enabled);
      
      if (!enabled) {
        setError('Konum servisleri kapalı. Haritayı görmek için ayarlardan konum servislerini açın.');
      }
      
      return enabled;
    } catch (error) {
      console.error('Location services check error:', error);
      setLocationServicesEnabled(false);
      setError('Konum servisleri kontrol edilemedi.');
      return false;
    }
  };

  // Konum izni iste - AppState ile yeniden kontrol
  const requestLocationPermission = async () => {
    try {
      setLoading(true);
      
      // Önce location servislerinin açık olup olmadığını kontrol et
      const servicesEnabled = await checkLocationServices();
      if (!servicesEnabled) {
        setLoading(false);
        return;
      }
      
      // Önce mevcut izin durumunu kontrol et
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setLocationPermission(true);
        setLoading(false);
        // Kısa bir gecikme ile konum al (permission state güncellensin)
        setTimeout(() => {
          getCurrentLocation();
        }, 100);
        return;
      }

      // İzin yoksa iste
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      setLoading(false);

      if (status === 'granted') {
        // Kısa bir gecikme ile konum al
        setTimeout(() => {
        getCurrentLocation();
        }, 100);
      } else {
        setError('Konum izni verilmedi. Haritayı görmek için ayarlardan izin verebilirsiniz.');
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationPermission(false);
      setLoading(false);
      setError('Konum izni alınırken bir hata oluştu.');
    }
  };

  // Mevcut konumu al - Timeout ve error handling ile
  const getCurrentLocation = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Timeout ile konum alma (15 saniye)
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000, // 15 saniye timeout
      });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Konum alma zaman aşımına uğradı')), 15000);
      });
      
      const location = await Promise.race([locationPromise, timeoutPromise]);
      
      if (!location || !location.coords) {
        throw new Error('Konum bilgisi alınamadı');
      }
      
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      // Koordinatları validate et
      if (!coords.latitude || !coords.longitude || 
          isNaN(coords.latitude) || isNaN(coords.longitude)) {
        throw new Error('Geçersiz konum bilgisi');
      }
      
      setUserLocation(coords);
      
      // Harita bölgesini ayarla (kullanıcı konumu merkez, şehir merkezine zoom)
      // Şehir merkezine zoom için daha geniş delta değerleri kullan
      const newRegion = {
        ...coords,
        latitudeDelta: 0.05, // Şehir merkezine zoom (yaklaşık 5-6 km görüş alanı)
        longitudeDelta: 0.05,
      };
      
      // Region'ı güvenli şekilde set et (Android crash önleme)
      setMapRegion(newRegion);
      
      // Konum alındıktan sonra yakındaki kafeleri getir
      await fetchNearbyCafes(coords.latitude, coords.longitude);
      
      setLoading(false);
    } catch (error) {
      console.error('Get location error:', error);
      setLoading(false);
      const errorMessage = error.message || 'Konum alınamadı. Lütfen tekrar deneyin.';
      setError(errorMessage);
      
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Hata', errorMessage, [
          { text: 'Tekrar Dene', onPress: () => getCurrentLocation() },
          { text: 'Tamam', style: 'cancel' },
        ]);
      }
    }
  };

  // Map region'ı kafeleri kapsayacak şekilde güncelle
  const updateMapRegionForCafes = useCallback((cafeList) => {
    if (!cafeList || cafeList.length === 0) {
      console.log('NearbyCafesMap: updateMapRegionForCafes - empty cafe list');
      return;
    }

    const validCafes = cafeList.filter(cafe => {
      const lat = Number(cafe.latitude);
      const lng = Number(cafe.longitude);
      return lat != null && lng != null &&
        !isNaN(lat) && !isNaN(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180;
    });

    console.log('NearbyCafesMap: valid cafes for region', validCafes.length, 'out of', cafeList.length);

    if (validCafes.length === 0) {
      console.warn('NearbyCafesMap: No valid cafes found for region update');
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

    // Delta değerleri (padding ekle - 1.5x)
    const latDelta = Math.max((maxLat - minLat) * 1.5, 0.05);
    const lngDelta = Math.max((maxLng - minLng) * 1.5, 0.05);

    const newRegion = {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };

    console.log('NearbyCafesMap: Updated map region to fit all markers', newRegion);
    setMapRegion(newRegion);
  }, []);

  // Yakındaki kafeleri getir - Dummy cafe verileri haritada gösterilecek
  const fetchNearbyCafes = async (latitude, longitude) => {
    setLoading(true);
    try {
      const cafes = await getNearbyCafes(latitude, longitude);
      console.log('NearbyCafesMap: Fetched cafes', cafes?.length || 0);
      console.log('NearbyCafesMap: Sample cafe data', cafes?.[0]);
      
      // Dummy cafe verileri - sadece bu uygulamaya ait kafeler
      // Gerçek Google Maps üzerinde marker olarak gösterilecek
      const validCafes = (cafes || []).filter(cafe => {
        const lat = Number(cafe.latitude);
        const lng = Number(cafe.longitude);
        const isValid = lat != null && lng != null && !isNaN(lat) && !isNaN(lng) &&
                        lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        if (!isValid) {
          console.warn('NearbyCafesMap: Filtered out invalid cafe', cafe.id, 'lat:', lat, 'lng:', lng);
        }
        return isValid;
      });
      
      console.log('NearbyCafesMap: Valid cafes for markers', validCafes.length, 'out of', cafes?.length || 0);
      if (validCafes.length > 0) {
        console.log('NearbyCafesMap: First valid cafe coordinates', validCafes[0].latitude, validCafes[0].longitude);
      }
      setNearbyCafes(validCafes);
    } catch (error) {
      console.error('Error fetching cafes:', error);
      if (Platform.OS === 'web') {
        window.alert(error.message || 'Yakındaki kafeler yüklenemedi.');
      } else {
      Alert.alert('Hata', error.message || 'Yakındaki kafeler yüklenemedi.');
      }
      setNearbyCafes([]);
    } finally {
      setLoading(false);
    }
  };

  // Yenile butonu
  const handleRefresh = () => {
    if (userLocation) {
      fetchNearbyCafes(userLocation.latitude, userLocation.longitude);
    } else if (locationPermission) {
      getCurrentLocation();
    } else {
      requestLocationPermission();
    }
  };

  // Ayarlara yönlendir
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // Harita provider seçimi (Android için Google Maps zorunlu, iOS için default)
  // Google Maps gerçek harita render eder
  const mapProvider = Platform.OS === 'android' && PROVIDER_GOOGLE 
    ? PROVIDER_GOOGLE 
    : Platform.OS === 'ios' && PROVIDER_DEFAULT 
    ? PROVIDER_DEFAULT 
    : null;
  
  // MapView render edilmeden önce tüm kontrolleri yap (Android crash önleme)
  // canRenderMap değişkenini component içinde tanımla
  // Location servisleri açık olmalı, permission verilmiş olmalı
  const canRenderMap = MapView && 
                       mapsReady && 
                       typeof MapView !== 'undefined' && 
                       mapProvider && 
                       mapRegion && 
                       mapRegion.latitude && 
                       mapRegion.longitude &&
                       !isNaN(mapRegion.latitude) &&
                       !isNaN(mapRegion.longitude) &&
                       locationPermission === true &&
                       locationServicesEnabled === true; // Location servisleri açık olmalı

  // Web için fallback render
  if (Platform.OS === 'web') {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Yakındaki Kafeler</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={loading}>
            <Text style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}>
              {loading ? 'Yükleniyor...' : 'Yenile'}
            </Text>
        </TouchableOpacity>
      </View>

      {!locationPermission ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Yakındaki kafeleri görmek için konum izni gereklidir.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.permissionButtonText}>İzin Ver</Text>
          </TouchableOpacity>
            {error && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={openSettings}
              >
                <Text style={styles.settingsButtonText}>Ayarlara Git</Text>
              </TouchableOpacity>
            )}
        </View>
      ) : (
          <View style={styles.webMapContainer}>
            <Text style={styles.webMapText}>🗺️ Harita Görünümü</Text>
            <Text style={styles.webMapInfo}>
              Harita özelliği mobil cihazlarda kullanılabilir.
            </Text>
            {userLocation && (
              <Text style={styles.locationText}>
                Konum: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </Text>
            )}
            {nearbyCafes.length > 0 && (
              <View style={styles.markersContainer}>
                <Text style={styles.markersText}>
                  {nearbyCafes.length} kafe bulundu
                </Text>
                {nearbyCafes.slice(0, 5).map((cafe, index) => (
                  <View key={index} style={styles.markerItem}>
                    <Text style={styles.markerText}>📍 {cafe.name || 'Kafe'}</Text>
                    {cafe.address && (
                      <Text style={styles.markerAddress}>{cafe.address}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  // Native platformlar için gerçek harita
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Yakındaki Kafeler</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={loading}>
          <Text style={[styles.refreshButton, loading && styles.refreshButtonDisabled]}>
            {loading ? 'Yükleniyor...' : 'Yenile'}
          </Text>
        </TouchableOpacity>
      </View>

      {locationServicesEnabled === false ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Konum servisleri kapalı. Haritayı görmek için ayarlardan konum servislerini açın.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              await checkLocationServices();
              if (locationServicesEnabled) {
                requestLocationPermission();
              } else {
                openSettings();
              }
            }}
          >
            <Text style={styles.permissionButtonText}>Ayarlara Git</Text>
          </TouchableOpacity>
        </View>
      ) : !locationPermission ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Yakındaki kafeleri görmek için konum izni gereklidir.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestLocationPermission}
          >
            <Text style={styles.permissionButtonText}>İzin Ver</Text>
          </TouchableOpacity>
          {error && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={openSettings}
            >
              <Text style={styles.settingsButtonText}>Ayarlara Git</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : !mapsReady ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Harita yükleniyor...</Text>
        </View>
      ) : !mapRegion ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Konum alınıyor...</Text>
        </View>
      ) : (
        <>
          {/* Gerçek Harita - Android crash önleme: Tüm kontroller yapıldıktan sonra render et */}
          {canRenderMap ? (
            <View style={styles.mapContainer}>
              <MapView
                provider={mapProvider}
                style={styles.map}
                initialRegion={mapRegion}
                region={mapRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
                onRegionChangeComplete={(newRegion) => {
                  // Region değişikliğini güvenli şekilde handle et
                  if (newRegion && newRegion.latitude && newRegion.longitude) {
                    setMapRegion(newRegion);
                  }
                }}
                mapType="standard"
                onError={(error) => {
                  console.error('MapView error:', error);
                  setError('Harita yüklenirken bir hata oluştu.');
                  // Hata durumunda loading state'i kapat
                  setLoading(false);
                }}
                onMapReady={() => {
                  console.log('Map is ready');
                  console.log('NearbyCafesMap: Markers to render', nearbyCafes.length);
                  setLoading(false);
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
              {/* Kafe Marker'ları - Gerçek Google Maps üzerinde gösterilecek */}
              {nearbyCafes && nearbyCafes.length > 0 && nearbyCafes.map((cafe, index) => {
                // Düzeltme: Koordinat validasyonu - lat == null veya lng == null kontrolü
                const lat = Number(cafe.latitude);
                const lng = Number(cafe.longitude);
                
                if (lat == null || lng == null || 
                    isNaN(lat) || isNaN(lng) ||
                    lat < -90 || lat > 90 ||
                    lng < -180 || lng > 180) {
                  console.warn('NearbyCafesMap: Invalid coordinates for cafe', cafe.id || index, 'lat:', lat, 'lng:', lng);
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
                    pinColor={colors.primary || '#007AFF'} // Lucky Table marka rengi
                    tracksViewChanges={false}
                    anchor={{ x: 0.5, y: 1 }}
                  >
                    <Callout>
                      <View style={styles.calloutContainer}>
                        <Text style={styles.calloutTitle}>{cafe.name || 'Kafe'}</Text>
                        {cafe.address && (
                          <Text style={styles.calloutAddress}>{cafe.address}</Text>
                        )}
                        {cafe.distance && (
                          <Text style={styles.calloutDistance}>
                            {cafe.distance.toFixed(2)} km uzaklıkta
                          </Text>
                        )}
                        <Text style={styles.calloutBadge}>✓ Lucky Table Partner</Text>
                      </View>
                    </Callout>
                  </Marker>
                );
              })}
              </MapView>
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Harita yükleniyor...</Text>
              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}
            </View>
          )}
          
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Kafeler yükleniyor...</Text>
            </View>
          )}
          
          {nearbyCafes.length === 0 && !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Yakınınızda kafe bulunamadı.</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textPrimary,
  },
  refreshButton: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  permissionContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  permissionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  settingsButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  settingsButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.sm,
    textDecorationLine: 'underline',
  },
  mapContainer: {
    height: 300,
    borderRadius: spacing.sm,
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: spacing.md + 40, // header height + padding
    left: spacing.md,
    right: spacing.md,
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: spacing.sm,
  },
  emptyContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    marginTop: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error || '#FF3B30',
    marginTop: spacing.sm,
    textAlign: 'center',
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
    marginBottom: spacing.xs,
  },
  calloutDistance: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  calloutBadge: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.bold,
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.primary + '20',
    borderRadius: spacing.xs,
    textAlign: 'center',
  },
  webMapContainer: {
    height: 300,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.md,
  },
  webMapText: {
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.sm,
  },
  webMapInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  markersContainer: {
    marginTop: spacing.md,
    width: '100%',
  },
  markersText: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  markerItem: {
    padding: spacing.xs,
    marginBottom: spacing.xs,
  },
  markerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  markerAddress: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});

export default NearbyCafesMap;
