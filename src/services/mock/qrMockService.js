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

    // QR kod içeriği MUTLAKA JWT token formatında olmalı
    // JWT format kontrolü: 3 parça olmalı (header.payload.signature)
    if (!qrCodeData || typeof qrCodeData !== 'string') {
      return {
        success: false,
        message: 'INVALID_QR',
        error: 'Geçersiz QR kod formatı',
        totalOrderCount: 0,
        remainingForPromotion: 0,
      };
    }

    // JWT token format kontrolü: en az 2 nokta içermeli
    const parts = qrCodeData.split('.');
    if (parts.length !== 3) {
      return {
        success: false,
        message: 'INVALID_QR',
        error: 'QR kod JWT token formatında değil. Beklenen format: header.payload.signature',
        totalOrderCount: 0,
        remainingForPromotion: 0,
      };
    }

    // JWT token'ı parse et ve doğrula
    let payload;
    try {
      const { verifyQRToken } = await import('../qrTokenService');
      payload = await verifyQRToken(qrCodeData);
      
      if (!payload) {
        // JWT token doğrulama başarısız
        return {
          success: false,
          message: 'INVALID_QR',
          error: 'Geçersiz veya süresi dolmuş QR kodu',
          totalOrderCount: 0,
          remainingForPromotion: 0,
        };
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
