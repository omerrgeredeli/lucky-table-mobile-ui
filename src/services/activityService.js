/**
 * Activity Service - Service Switch Layer
 * Mock ve gerçek API arasında geçiş yapar
 * Tüm screen'ler bu servisi kullanır
 */

import { USE_MOCK_API } from '../config/api';
import * as mockService from './mock/activityMockService';
import * as apiService from './api/activityApiService';

/**
 * Service switch - USE_MOCK_API flag'ine göre mock veya real servis kullanır
 */
const getService = () => (USE_MOCK_API ? mockService : apiService);

/**
 * Son 10 activity/order'ı getir (bildirimler için)
 * Activity table'dan son 10 order'ı çeker
 * @returns {Promise<Array>} Activity listesi
 */
export const getRecentActivities = async () => {
  const service = getService();
  const response = await service.getRecentActivities();

  // Screen'ler için backward compatibility - hata durumunda throw et
  if (!response.success) {
    throw new Error(response.error?.message || 'Activity bilgileri alınamadı');
  }

  return response.data;
};
