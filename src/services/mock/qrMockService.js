/**
 * QR Mock Service
 * Mock modda QR kod işleme simülasyonu
 * TEK VE ZORUNLU QR PAYLOAD ŞEMASI kullanır
 */

/**
 * QR kod işleme - Mock implementation
 * Gerçek backend'e gitmiş gibi simüle eder
 * CUSTOMER: ORDER QR okur → Ödeme / sipariş işlemi başlatılır
 * 
 * @param {string} qrCodeData - QR koddan okunan veri (JSON string veya JWT token)
 * @param {string} userId - Kullanıcı ID (Customer)
 * @param {string} deviceId - Cihaz ID
 * @returns {Promise<{success: boolean, message: string, totalOrderCount: number, remainingForPromotion: number}>}
 */
export const processQrCode = async (qrCodeData, userId = null, deviceId = null) => {
  try {
    // Network gecikmesi simüle et (1-2 saniye)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // QR kod validasyonu
    if (!qrCodeData || qrCodeData.trim().length === 0) {
      return {
        success: false,
        message: 'INVALID_QR',
        error: 'Geçersiz QR kod',
        totalOrderCount: 0,
        remainingForPromotion: 0,
      };
    }

    // QR kod içeriğini parse et
    let payload;
    try {
      // Önce JWT token formatında mı kontrol et
      const { verifyQRToken } = await import('../qrTokenService');
      payload = await verifyQRToken(qrCodeData);
      
      if (!payload) {
        // Token değilse, direkt JSON olabilir
        payload = JSON.parse(qrCodeData);
      }
    } catch (error) {
      console.error('QR payload parse error:', error);
      return {
        success: false,
        message: 'INVALID_QR',
        error: 'Geçersiz QR kod formatı',
        totalOrderCount: 0,
        remainingForPromotion: 0,
      };
    }

    // TEK VE ZORUNLU QR PAYLOAD ŞEMASI kontrolü
    if (!payload.qrType) {
      return {
        success: false,
        message: 'INVALID_QR',
        error: 'QR kod tipi belirtilmemiş',
        totalOrderCount: 0,
        remainingForPromotion: 0,
      };
    }

    // CUSTOMER: ORDER QR okur
    if (payload.qrType === 'ORDER') {
      // ORDER QR validasyonu
      if (!payload.orderId || !payload.businessId || !payload.customerId) {
        return {
          success: false,
          message: 'INVALID_QR',
          error: 'Eksik sipariş bilgileri',
          totalOrderCount: 0,
          remainingForPromotion: 0,
        };
      }

      // Süresi dolmuş mu?
      if (payload.expiresAt) {
        try {
          const expireDate = new Date(payload.expiresAt);
          const now = new Date();
          if (expireDate < now) {
            return {
              success: false,
              message: 'EXPIRED_QR',
              error: 'QR kod süresi dolmuş',
              totalOrderCount: 0,
              remainingForPromotion: 0,
            };
          }
        } catch (error) {
          console.error('Expire date check error:', error);
        }
      }

      // Kullanılmış mı?
      if (payload.used) {
        return {
          success: false,
          message: 'USED_QR',
          error: 'QR kod daha önce kullanılmış',
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
        orderId: payload.orderId,
        businessId: payload.businessId,
        businessName: payload.businessName,
      };
    } else if (payload.qrType === 'PROMOTION') {
      // CUSTOMER PROMOTION QR okumaz, sadece BUSINESS okur
      return {
        success: false,
        message: 'INVALID_QR_TYPE',
        error: 'Bu QR kodu sipariş için değil',
        totalOrderCount: 0,
        remainingForPromotion: 0,
      };
    } else {
      return {
        success: false,
        message: 'INVALID_QR_TYPE',
        error: 'Bilinmeyen QR kod tipi',
        totalOrderCount: 0,
        remainingForPromotion: 0,
      };
    }
  } catch (error) {
    console.error('QR process error:', error);
    return {
      success: false,
      message: 'PROCESS_ERROR',
      error: error.message || 'QR kod işleme hatası',
      totalOrderCount: 0,
      remainingForPromotion: 0,
    };
  }
};
