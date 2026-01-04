/**
 * Cafe Mock Service
 * Mock cafe servisleri - standart response contract kullanır
 */

import { mockCafeSearch, mockNearbyCafes } from '../../utils/mockData';

/**
 * Response contract helper
 */
const createResponse = (success, data = null, error = null) => ({
  success,
  data,
  error,
});

/**
 * Simüle edilmiş gecikme
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Kafe arama (Mock)
 * @param {string} searchQuery - Arama sorgusu
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const searchCafes = async (searchQuery) => {
  await delay(300 + Math.random() * 400); // 300-700ms

  const results = mockCafeSearch(searchQuery);

  return createResponse(
    true,
    results,
    null
  );
};

/**
 * Yakındaki kafeleri getir (Mock)
 * @param {number} latitude - Enlem
 * @param {number} longitude - Boylam
 * @param {number} radius - Yarıçap (metre cinsinden, opsiyonel)
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getNearbyCafes = async (latitude, longitude, radius = 5000) => {
  await delay(400 + Math.random() * 300); // 400-700ms

  // Hata senaryosu: geçersiz koordinatlar
  if (!latitude || !longitude) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_COORDINATES',
        message: 'Geçerli koordinat bilgileri giriniz',
      }
    );
  }

  const results = mockNearbyCafes(latitude, longitude);

  return createResponse(
    true,
    results,
    null
  );
};

