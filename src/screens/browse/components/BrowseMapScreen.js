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
  const [selectedCafe, setSelectedCafe] = useState(null); // Seçili kafe için yol tarifi butonu

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
    // Prop'tan gelen kafeler varsa ve boş değilse kullan
    if (propCafes && Array.isArray(propCafes) && propCafes.length > 0) {
      setCafes(propCafes);
      return;
    }
    // Prop'tan gelen kafeler yoksa veya boşsa, API'den veya mock'tan yükle
    try {
      const response = await getNearbyCafes(latitude, longitude);
      if (response && response.success && response.data && response.data.length > 0) {
        setCafes(response.data);
      } else {
        // Mock data kullan
        const { mockNearbyCafes } = require('../../../utils/mockData');
        const mockCafes = mockNearbyCafes(latitude, longitude);
        setCafes(mockCafes);
      }
    } catch (error) {
      console.error('Error loading cafes:', error);
      // Hata durumunda da mock data kullan
      const { mockNearbyCafes } = require('../../../utils/mockData');
      const mockCafes = mockNearbyCafes(latitude, longitude);
      setCafes(mockCafes);
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
                       mapRegion.latitude && 
                       mapRegion.longitude &&
                       !isNaN(mapRegion.latitude) &&
                       !isNaN(mapRegion.longitude) &&
                       locationServicesEnabled !== false; // Location servisleri açık olmalı

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
        {cafes && cafes.length > 0 ? (
          cafes.map((cafe, index) => {
            if (!cafe.latitude || !cafe.longitude) return null;

            return (
              <Marker
                key={`cafe-${cafe.id || index}`}
                coordinate={{
                  latitude: cafe.latitude,
                  longitude: cafe.longitude,
                }}
                title={cafe.name || 'Kafe'}
                description={cafe.address || ''}
                pinColor={colors.primary}
                tracksViewChanges={false}
                anchor={{ x: 0.5, y: 1 }}
                onPress={() => {
                  // Marker seçildiğinde sadece state'i güncelle, yol tarifi butonu gösterilecek
                  setSelectedCafe(cafe);
                }}
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
          })
        ) : null}
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

      {/* Google Maps'in kendi yol tarifi butonu - Konumum ikonunun hemen altında */}
      {selectedCafe && selectedCafe.latitude && selectedCafe.longitude && (
        <View 
          style={[
            styles.directionsButtonContainer,
            // showsMyLocationButton varsa (locationPermission ve locationServicesEnabled true ise) hemen altında
            locationPermission === true && locationServicesEnabled === true ? {
              bottom: 16, // Konumum butonu genellikle 16px yukarıda, bunun hemen altı
            } : {
              bottom: spacing.lg, // Konumum butonu yoksa normal pozisyon
            }
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={() => {
              if (selectedCafe.latitude && selectedCafe.longitude) {
                const url = Platform.select({
                  ios: `maps://maps.apple.com/?daddr=${selectedCafe.latitude},${selectedCafe.longitude}&dirflg=d`,
                  android: `google.navigation:q=${selectedCafe.latitude},${selectedCafe.longitude}`,
                });
                if (url) {
                  Linking.openURL(url).catch((err) => {
                    console.error('Yol tarifi açılamadı:', err);
                    // Fallback: Google Maps web URL
                    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedCafe.latitude},${selectedCafe.longitude}`;
                    Linking.openURL(webUrl).catch((err2) => {
                      console.error('Web harita açılamadı:', err2);
                    });
                  });
                }
              }
            }}
            activeOpacity={0.7}
          >
            <View style={styles.directionsIconContainer}>
              {/* Google Maps yol tarifi ikonu - mavi daire içinde beyaz ok */}
              <View style={styles.directionsIconWrapper}>
                <View style={styles.directionsIconCircle} />
                <Text style={styles.directionsIcon}>→</Text>
              </View>
            </View>
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
  directionsButtonContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    zIndex: 1000,
  },
  directionsButton: {
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  directionsIconContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionsIconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  directionsIconCircle: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
  },
  directionsIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 16,
    zIndex: 1,
  },
});

export default BrowseMapScreen;

