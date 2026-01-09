/**
 * QR API Service
 * Production modda gerçek backend entegrasyonu
 */

import { API_BASE_URL } from '../../config/api';

/**
 * QR kod işleme - Real API implementation
 * Backend'e POST isteği gönderir
 * 
 * @param {string} qrCodeData - QR koddan okunan veri
 * @param {string} userId - Kullanıcı ID
 * @param {string} deviceId - Cihaz ID
 * @returns {Promise<{success: boolean, message: string, totalOrderCount: number, remainingForPromotion: number}>}
 */
export const processQrCode = async (qrCodeData, userId = null, deviceId = null) => {
  try {
    // Backend endpoint
    const endpoint = `${API_BASE_URL}/api/qr/process`;

    // Request payload
    const payload = {
      qrCodeData,
      userId,
      deviceId,
    };

    // POST isteği
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Authorization header eklenebilir
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Backend response formatı:
    // {
    //   success: boolean,
    //   message: string,
    //   totalOrderCount: number,
    //   remainingForPromotion: number
    // }

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'QR_PROCESSING_ERROR',
        error: data.error || 'QR kod işleme hatası',
        totalOrderCount: 0,
        remainingForPromotion: 0,
      };
    }

    return {
      success: data.success || false,
      message: data.message || 'UNKNOWN',
      totalOrderCount: data.totalOrderCount || 0,
      remainingForPromotion: data.remainingForPromotion || 0,
    };
  } catch (error) {
    console.error('QR API error:', error);
    
    // Network hatası
    return {
      success: false,
      message: 'NETWORK_ERROR',
      error: error.message || 'Bağlantı hatası',
      totalOrderCount: 0,
      remainingForPromotion: 0,
    };
  }
};
