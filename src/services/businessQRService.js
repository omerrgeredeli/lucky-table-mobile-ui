/**
 * Business QR Service
 * İşletme kullanıcıları için QR kod üretme ve okuma servisleri
 * Mock ve real API uyumlu
 */

import { USE_MOCK_API } from '../config/api';

/**
 * Unique identifier üretir
 * @returns {string} Unique code
 */
const generateUniqueCode = () => {
  // Basit unique code: timestamp + random
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Business QR kod üretir (sipariş için)
 * @param {Object} data - { orderTypes, businessName, userId }
 * @returns {Promise<string>} QR kod string (JSON stringify edilmiş)
 */
export const generateBusinessQRCode = async (data) => {
  try {
    const { orderTypes, businessName, userId } = data;
    
    if (!orderTypes || orderTypes.length === 0) {
      throw new Error('Sipariş tipi seçilmedi');
    }
    
    if (!businessName) {
      throw new Error('İşletme adı bulunamadı');
    }
    
    // QR kod payload
    const qrPayload = {
      orderTypes: orderTypes,
      businessName: businessName,
      userId: userId,
      orderDate: new Date().toISOString(),
      uniqueCode: generateUniqueCode(),
      createdAt: new Date().toISOString(),
    };
    
    // JSON stringify
    const qrString = JSON.stringify(qrPayload);
    
    return qrString;
  } catch (error) {
    console.error('Business QR generation error:', error);
    throw error;
  }
};

/**
 * Promosyon QR kodunu okur ve doğrular
 * @param {string} qrData - QR kod içeriği (promosyon token)
 * @param {string} userToken - Business user token
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const scanPromotionQRCode = async (qrData, userToken) => {
  try {
    if (USE_MOCK_API) {
      return await scanPromotionQRCodeMock(qrData, userToken);
    } else {
      return await scanPromotionQRCodeAPI(qrData, userToken);
    }
  } catch (error) {
    console.error('Promotion QR scan error:', error);
    return {
      success: false,
      error: error.message || 'QR kod okuma hatası',
    };
  }
};

/**
 * Mock: Promosyon QR kodunu okur
 */
const scanPromotionQRCodeMock = async (qrData, userToken) => {
  // QR kod içeriği JWT token formatında olabilir
  // Önce token'ı parse et
  const { verifyQRToken } = await import('./qrTokenService');
  const payload = await verifyQRToken(qrData);
  
  if (!payload) {
    // Token formatında değilse, direkt JSON olabilir
    try {
      const parsed = JSON.parse(qrData);
      if (parsed.promotionId && parsed.userId) {
        // Mock promosyon kullanımı
        const { usePromotion } = await import('./mock/promotionMockService');
        return await usePromotion(parsed.promotionId, parsed.userId, userToken);
      }
    } catch (e) {
      // JSON parse hatası
    }
    
    return {
      success: false,
      error: 'Geçersiz QR kodu',
    };
  }
  
  // Token payload'dan promosyon bilgilerini al
  const { promotionId, userId, promotionExpireDate, isUsed } = payload;
  
  // Süresi dolmuş mu?
  if (promotionExpireDate) {
    const expireDate = new Date(promotionExpireDate);
    const now = new Date();
    if (expireDate < now) {
      return {
        success: false,
        error: 'Süresi dolmuş promosyon',
      };
    }
  }
  
  // Kullanılmış mı?
  if (isUsed) {
    return {
      success: false,
      error: 'Kullanılmış promosyon',
    };
  }
  
  // Promosyonu kullan
  if (promotionId && userId) {
    try {
      const { usePromotion } = await import('./mock/promotionMockService');
      return await usePromotion(promotionId, userId, userToken);
    } catch (error) {
      console.error('Promotion service import error:', error);
      return {
        success: false,
        error: 'Promosyon servisi yüklenemedi',
      };
    }
  }
  
  return {
    success: false,
    error: 'Promosyon bilgisi bulunamadı',
  };
};

/**
 * Real API: Promosyon QR kodunu okur
 */
const scanPromotionQRCodeAPI = async (qrData, userToken) => {
  // Real API endpoint'e istek at
  // Şimdilik mock döndür
  return {
    success: false,
    error: 'Real API henüz implement edilmedi',
  };
};

