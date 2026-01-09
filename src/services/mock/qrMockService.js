/**
 * QR Mock Service
 * Mock modda QR kod işleme simülasyonu
 */

/**
 * QR kod işleme - Mock implementation
 * Gerçek backend'e gitmiş gibi simüle eder
 * 
 * @param {string} qrCodeData - QR koddan okunan veri
 * @param {string} userId - Kullanıcı ID
 * @param {string} deviceId - Cihaz ID
 * @returns {Promise<{success: boolean, message: string, totalOrderCount: number, remainingForPromotion: number}>}
 */
export const processQrCode = async (qrCodeData, userId = null, deviceId = null) => {
  // Network gecikmesi simüle et (1-2 saniye)
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // QR kod validasyonu (mock)
  if (!qrCodeData || qrCodeData.trim().length === 0) {
    return {
      success: false,
      message: 'INVALID_QR',
      error: 'Geçersiz QR kod',
      totalOrderCount: 0,
      remainingForPromotion: 0,
    };
  }

  // Mock response - başarılı ödeme
  // Gerçek backend response formatına uygun
  return {
    success: true,
    message: 'PAID',
    totalOrderCount: 7,
    remainingForPromotion: 3,
  };
};
