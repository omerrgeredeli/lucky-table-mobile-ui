/**
 * Cafe API Service
 * Gerçek Spring backend cafe servisleri - standart response contract kullanır
 */

import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Response contract helper
 */
const createResponse = (success, data = null, error = null) => ({
  success,
  data,
  error,
});

/**
 * Token'ı AsyncStorage'dan al
 */
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Token alma hatası:', error);
    return null;
  }
};

/**
 * API çağrısı helper (authenticated)
 */
const apiCall = async (endpoint, options = {}) => {
  try {
    const token = await getToken();
    
    if (!token) {
      return createResponse(
        false,
        null,
        {
          code: 'UNAUTHORIZED',
          message: 'Token bulunamadı. Lütfen giriş yapın.',
        }
      );
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return createResponse(
        false,
        null,
        {
          code: data.code || `HTTP_${response.status}`,
          message: data.message || `İstek başarısız (${response.status})`,
        }
      );
    }

    // Backend'den gelen response'u standart formata çevir
    if (data.success !== undefined) {
      return data;
    }

    // Backend standart format kullanmıyorsa, başarılı response olarak wrap et
    return createResponse(true, data, null);
  } catch (error) {
    console.error('API call error:', error);
    return createResponse(
      false,
      null,
      {
        code: 'NETWORK_ERROR',
        message: error.message || 'Bağlantı hatası oluştu',
      }
    );
  }
};

/**
 * Kafe arama
 * @param {string} searchQuery - Arama sorgusu
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const searchCafes = async (searchQuery) => {
  const queryParam = encodeURIComponent(searchQuery || '');
  return await apiCall(`/cafes/search?q=${queryParam}`, {
    method: 'GET',
  });
};

/**
 * Yakındaki kafeleri getir
 * @param {number} latitude - Enlem
 * @param {number} longitude - Boylam
 * @param {number} radius - Yarıçap (metre cinsinden, opsiyonel)
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getNearbyCafes = async (latitude, longitude, radius = 5000) => {
  return await apiCall(`/cafes/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`, {
    method: 'GET',
  });
};

