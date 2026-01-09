/**
 * QR Service - Mock / Real API Switch
 * QR kod işleme servisi - mock ve production modları için hazır
 */

import { USE_MOCK_API } from '../config/api';
import * as mockQrService from './mock/qrMockService';
import * as apiQrService from './api/qrApiService';

/**
 * Service switch - USE_MOCK_API flag'ine göre mock veya real servis kullanır
 */
const getService = () => (USE_MOCK_API ? mockQrService : apiQrService);

/**
 * QR kod işleme fonksiyonu
 * Mock modda: simüle edilmiş response döner
 * Real modda: backend'e POST isteği gönderir
 * 
 * @param {string} qrCodeData - QR koddan okunan veri
 * @param {string} userId - Kullanıcı ID (AuthContext'ten alınacak)
 * @param {string} deviceId - Cihaz ID (opsiyonel)
 * @returns {Promise<{success: boolean, message: string, totalOrderCount: number, remainingForPromotion: number}>}
 */
export const processQrCode = async (qrCodeData, userId = null, deviceId = null) => {
  const service = getService();
  return await service.processQrCode(qrCodeData, userId, deviceId);
};
