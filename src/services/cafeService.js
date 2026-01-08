/**
 * Cafe Service - Service Switch Layer
 * Mock ve gerçek API arasında geçiş yapar
 * Tüm screen'ler bu servisi kullanır
 */

import { USE_MOCK_API } from '../config/api';
import * as mockService from './mock/cafeMockService';
import * as apiService from './api/cafeApiService';

/**
 * Service switch - USE_MOCK_API flag'ine göre mock veya real servis kullanır
 */
const getService = () => (USE_MOCK_API ? mockService : apiService);

/**
 * Kafe arama
 * @param {string} searchQuery - Arama sorgusu
 * @returns {Promise<Array>} Kafe listesi
 */
export const searchCafes = async (searchQuery) => {
  const service = getService();
  const response = await service.searchCafes(searchQuery);

  // Screen'ler için backward compatibility - hata durumunda throw et
  if (!response.success) {
    throw new Error(response.error?.message || 'Kafe arama başarısız');
      }

  return response.data;
};

/**
 * Yakındaki kafeleri getir
 * @param {number} latitude - Enlem
 * @param {number} longitude - Boylam
 * @param {number} radius - Yarıçap (metre cinsinden, opsiyonel)
 * @returns {Promise<Array>} Yakındaki kafe listesi
 */
export const getNearbyCafes = async (latitude, longitude, radius = 5000) => {
  const service = getService();
  const response = await service.getNearbyCafes(latitude, longitude, radius);

  // Screen'ler için backward compatibility - hata durumunda throw et
  if (!response.success) {
    throw new Error(response.error?.message || 'Yakındaki kafeler alınamadı');
    }

  return response.data;
};
