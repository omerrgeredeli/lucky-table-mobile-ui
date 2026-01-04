/**
 * User API Service
 * Gerçek Spring backend user servisleri - standart response contract kullanır
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
 * Kullanıcı profil bilgilerini getir
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getProfile = async () => {
  return await apiCall('/user/profile', {
    method: 'GET',
  });
};

/**
 * Kullanıcı profil bilgilerini güncelle
 * @param {Object} profileData - Güncellenecek profil bilgileri
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const updateProfile = async (profileData) => {
  return await apiCall('/user/update-profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

/**
 * Kullanıcının sipariş ve sadakat bilgilerini getir
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getUserLoyaltyInfo = async () => {
  return await apiCall('/user/loyalty-info', {
    method: 'GET',
  });
};

/**
 * Ana sayfa verilerini getir
 * Kullanıcının gittiği kafeler, sipariş sayıları, ücretsiz ürün eşiği, yakındaki kafeler
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getHomeData = async () => {
  return await apiCall('/user/home', {
    method: 'GET',
  });
};

