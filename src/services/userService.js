import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, USE_MOCK_DATA, IS_DEVELOPMENT } from '../config/api';
import { mockLoyaltyData } from '../utils/mockData';

/**
 * User Service - Kullanıcı ile ilgili API çağrıları
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
 * Kullanıcı profil bilgilerini getir
 * @returns {Promise<Object>} Kullanıcı bilgileri
 */
export const getUserProfile = async () => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Profil bilgileri alınamadı');
    }

    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

/**
 * Kullanıcı profil bilgilerini güncelle
 * @param {Object} profileData - Güncellenecek profil bilgileri
 * @returns {Promise<Object>} Güncellenmiş kullanıcı bilgileri
 */
export const updateUserProfile = async (profileData) => {
  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Token bulunamadı');
    }

    const response = await fetch(`${API_BASE_URL}/user/update-profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Profil güncelleme başarısız');
    }

    return data;
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

/**
 * Kullanıcının sipariş ve sadakat bilgilerini getir
 * @returns {Promise<Array>} Kafe ve sipariş bilgileri listesi
 */
export const getUserLoyaltyInfo = async () => {
  // Mock data kullan
  if (USE_MOCK_DATA) {
    if (IS_DEVELOPMENT) {
      console.log('📦 Using mock loyalty data');
    }
    // Simüle edilmiş gecikme
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockLoyaltyData;
  }

  try {
    const token = await getToken();
    
    if (!token) {
      throw new Error('Token bulunamadı. Lütfen giriş yapın.');
    }

    const response = await fetch(`${API_BASE_URL}/user/loyalty-info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Sadakat bilgileri alınamadı (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Get loyalty info error:', error);
    
    // Network veya CORS hatası - mock data kullan
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      if (IS_DEVELOPMENT) {
        console.warn('⚠️ Backend bağlantısı kurulamadı, mock data kullanılıyor');
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      return mockLoyaltyData;
    }
    
    throw error;
  }
};

