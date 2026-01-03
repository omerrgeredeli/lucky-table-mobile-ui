import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { getNearbyCafes } from '../../../services/cafeService';
import { colors, spacing, typography, shadows } from '../../../theme';

/**
 * NearbyCafesMap Component - Micro-Screen Architecture
 * Yakındaki kafeleri gösterir (harita placeholder)
 * Bu component tamamen bağımsızdır, kendi state'ini yönetir
 */
const NearbyCafesMap = () => {
  const [nearbyCafes, setNearbyCafes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Component mount olduğunda konum izni iste
  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Konum izni iste
  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');

      if (status === 'granted') {
        getCurrentLocation();
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationPermission(false);
    }
  };

  // Mevcut konumu al
  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      // Konum alındıktan sonra yakındaki kafeleri getir
      fetchNearbyCafes(location.coords.latitude, location.coords.longitude);
    } catch (error) {
      console.error('Get location error:', error);
      Alert.alert('Hata', 'Konum alınamadı. Lütfen tekrar deneyin.');
    }
  };

  // Yakındaki kafeleri getir
  const fetchNearbyCafes = async (latitude, longitude) => {
    setLoading(true);
    try {
      const cafes = await getNearbyCafes(latitude, longitude);
      setNearbyCafes(cafes || []);
    } catch (error) {
      Alert.alert('Hata', error.message || 'Yakındaki kafeler yüklenemedi.');
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Yakındaki Kafeler</Text>
        <TouchableOpacity onPress={handleRefresh} disabled={loading}>
          <Text style={styles.refreshButton}>Yenile</Text>
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
        </View>
      ) : (
        <>
          {/* Harita placeholder - gerçek harita implementasyonu için react-native-maps kullanılabilir */}
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>🗺️ Harita Görünümü</Text>
            {userLocation && (
              <Text style={styles.locationText}>
                Konum: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </Text>
            )}
          </View>

          {/* Kafe listesi */}
          <View style={styles.cafesList}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.loadingText}>Yükleniyor...</Text>
              </View>
            ) : nearbyCafes.length === 0 ? (
              <Text style={styles.emptyText}>Yakınınızda kafe bulunamadı.</Text>
            ) : (
              nearbyCafes.slice(0, 5).map((cafe, index) => (
                <View key={index} style={styles.cafeItem}>
                  <Text style={styles.cafeName}>{cafe.name || 'Kafe Adı'}</Text>
                  {cafe.address && (
                    <Text style={styles.cafeAddress}>{cafe.address}</Text>
                  )}
                  {cafe.distance && (
                    <Text style={styles.cafeDistance}>
                      {cafe.distance.toFixed(2)} km uzaklıkta
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md - 4, // 12
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 4, // 12
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
  permissionContainer: {
    padding: spacing.lg - 4, // 20
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
    paddingHorizontal: spacing.lg - 4, // 20
    paddingVertical: spacing.sm + 2, // 10
    borderRadius: spacing.sm,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  mapPlaceholder: {
    height: 200,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  mapPlaceholderText: {
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.sm,
  },
  locationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  cafesList: {
    marginTop: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg - 4, // 20
  },
  loadingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.lg - 4, // 20
  },
  cafeItem: {
    padding: spacing.sm + 4, // 12
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: spacing.sm,
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
});

export default NearbyCafesMap;

