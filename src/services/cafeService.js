import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, USE_MOCK_DATA, IS_DEVELOPMENT } from '../config/api';
import { mockCafeSearch, mockNearbyCafes } from '../utils/mockData';

/**
 * Cafe Service - Kafe ile ilgili API çağrıları
 */

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
 * Kafe arama
 * @param {string} searchQuery - Arama sorgusu
 * @returns {Promise<Array>} Kafe listesi
 */
export const searchCafes = async (searchQuery) => {
  // Mock data kullan
  if (USE_MOCK_DATA) {
    if (IS_DEVELOPMENT) {
      console.log('📦 Using mock cafe search data');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockCafeSearch(searchQuery);
  }

  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Token bulunamadı. Lütfen giriş yapın.');
    }

    const response = await fetch(`${API_BASE_URL}/cafes/search?q=${encodeURIComponent(searchQuery)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Kafe arama başarısız (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search cafes error:', error);
    
    // Network veya CORS hatası - mock data kullan
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      if (IS_DEVELOPMENT) {
        console.warn('⚠️ Backend bağlantısı kurulamadı, mock data kullanılıyor');
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockCafeSearch(searchQuery);
    }
    
    throw error;
  }
};

/**
 * Yakındaki kafeleri getir
 * @param {number} latitude - Enlem
 * @param {number} longitude - Boylam
 * @param {number} radius - Yarıçap (metre cinsinden, opsiyonel)
 * @returns {Promise<Array>} Yakındaki kafe listesi
 */
export const getNearbyCafes = async (latitude, longitude, radius = 5000) => {
  // Mock data kullan
  if (USE_MOCK_DATA) {
    if (IS_DEVELOPMENT) {
      console.log('📦 Using mock nearby cafes data');
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockNearbyCafes(latitude, longitude);
  }

  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Token bulunamadı. Lütfen giriş yapın.');
    }

    const response = await fetch(
      `${API_BASE_URL}/cafes/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Yakındaki kafeler alınamadı (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get nearby cafes error:', error);
    
    // Network veya CORS hatası - mock data kullan
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      if (IS_DEVELOPMENT) {
        console.warn('⚠️ Backend bağlantısı kurulamadı, mock data kullanılıyor');
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockNearbyCafes(latitude, longitude);
    }
    
    throw error;
  }
};

