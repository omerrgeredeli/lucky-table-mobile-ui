/**
 * Business QR Service
 * İşletme kullanıcıları için QR kod üretme ve okuma servisleri
 * Mock ve real API uyumlu
 */

import { USE_MOCK_API } from '../config/api';

/**
 * Nonce (unique identifier) üretir
 * @returns {string} Nonce
 */
const generateNonce = () => {
  // Basit nonce: timestamp + random
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Business QR kod üretir (sipariş için)
 * ORTAK PAYLOAD YAPISI kullanır
 * PAYLOAD VALIDATION ile güvenli
 * 
 * @param {Object} data - { orderTypes, businessName, userId, businessId (optional) }
 * @returns {Promise<string>} QR kod string (JSON stringify edilmiş)
 */
export const generateBusinessQRCode = async (data) => {
  // PAYLOAD VALIDATION - Gerekli alanları kontrol et
  if (!data || typeof data !== 'object') {
    throw new Error('QR kod verisi geçersiz');
  }

  const { orderTypes, businessName, userId, businessId } = data;
  
  // Required fields kontrolü
  if (!orderTypes || !Array.isArray(orderTypes) || orderTypes.length === 0) {
    throw new Error('Sipariş tipi seçilmedi');
  }
  
  if (!businessName || typeof businessName !== 'string' || businessName.trim() === '') {
    throw new Error('İşletme adı bulunamadı');
  }

  if (!userId || (typeof userId !== 'number' && typeof userId !== 'string')) {
    throw new Error('Kullanıcı ID geçersiz');
  }

  // Business ID - parametre olarak al veya businessName'den türet
  const finalBusinessId = businessId || String(businessName || 'unknown');

  // Nonce üret
  const nonce = generateNonce();

  // Tarih hesaplamaları
  const createdAt = new Date().toISOString();
  // Business QR için expiresAt: 24 saat sonra (sipariş QR'ları genellikle kısa süreli)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  // TEK VE ZORUNLU QR PAYLOAD ŞEMASI - Business için ORDER
  let qrPayload;
  try {
    // Order ID oluştur (sipariş için)
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    qrPayload = {
      qrType: 'ORDER', // ZORUNLU
      promoId: null, // ORDER için null
      orderId: orderId, // ORDER için orderId
      customerId: String(userId), // userId -> customerId
      businessId: String(finalBusinessId),
      businessName: String(businessName),
      promoType: null, // ORDER için null
      orderTypes: orderTypes.map(ot => String(ot)), // Seçilen yiyecek/içecek tipleri
      createdAt: createdAt,
      expiresAt: expiresAt,
      used: false, // QR kod oluşturulurken her zaman false
      nonce: nonce,
    };
  } catch (error) {
    throw new Error(`Payload oluşturulamadı: ${error.message}`);
  }

  // JSON.stringify validation - try/catch ile güvenli
  let qrString;
  try {
    qrString = JSON.stringify(qrPayload);
    if (!qrString || qrString === '{}') {
      throw new Error('Payload stringify başarısız');
    }
  } catch (error) {
    throw new Error(`Payload stringify hatası: ${error.message}`);
  }
  
  return qrString;
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
 * ORTAK PAYLOAD YAPISI kullanır
 */
const scanPromotionQRCodeMock = async (qrData, userToken) => {
  // QR kod içeriği JWT token formatında olabilir
  // Önce token'ı parse et
  const { verifyQRToken } = await import('./qrTokenService');
  let payload = await verifyQRToken(qrData);
  
  if (!payload) {
    // Token formatında değilse, direkt JSON olabilir (Business QR için)
    try {
      const parsed = JSON.parse(qrData);
      // TEK VE ZORUNLU QR PAYLOAD ŞEMASI kontrolü
      if (parsed.qrType === 'PROMOTION' && parsed.promoId && (parsed.customerId || parsed.userId)) {
        // Yeni format - customerId kullan
        payload = {
          ...parsed,
          customerId: parsed.customerId || parsed.userId, // Eski format uyumluluğu
        };
      } else if (parsed.promoId && (parsed.customerId || parsed.userId)) {
        // Eski format uyumluluğu
        payload = {
          qrType: 'PROMOTION',
          promoId: parsed.promoId || parsed.promotionId,
          orderId: parsed.orderId || null,
          customerId: parsed.customerId || parsed.userId,
          businessId: parsed.businessId || null,
          businessName: parsed.businessName || null,
          promoType: parsed.promoType || null,
          orderTypes: parsed.orderTypes || null,
          createdAt: parsed.createdAt || new Date().toISOString(),
          expiresAt: parsed.expiresAt || parsed.promotionExpireDate,
          used: parsed.used || parsed.isUsed || false,
          nonce: parsed.nonce || parsed.uniqueCode || null,
        };
      } else {
        return {
          success: false,
          error: 'Geçersiz QR kodu',
        };
      }
    } catch (e) {
      // JSON parse hatası
      return {
        success: false,
        error: 'Geçersiz QR kodu formatı',
      };
    }
  }
  
  // TEK VE ZORUNLU QR PAYLOAD ŞEMASI - qrType kontrolü
  if (!payload.qrType || payload.qrType !== 'PROMOTION') {
    return {
      success: false,
      error: 'Bu QR kodu promosyon için değil',
    };
  }
  
  // Token payload'dan promosyon bilgilerini al (yeni yapı)
  const { promoId, customerId, expiresAt, used } = payload;
  
  // Eski format uyumluluğu
  const promotionId = promoId || payload.promotionId;
  const userId = customerId || payload.userId || payload.customerId; // customerId kullan
  const promotionExpireDate = expiresAt || payload.promotionExpireDate;
  const isUsed = used !== undefined ? used : (payload.isUsed || false);
  
  // Süresi dolmuş mu?
  if (promotionExpireDate) {
    try {
      const expireDate = new Date(promotionExpireDate);
      const now = new Date();
      if (isNaN(expireDate.getTime())) {
        return {
          success: false,
          error: 'Geçersiz tarih formatı',
        };
      }
      if (expireDate < now) {
        return {
          success: false,
          error: 'Süresi dolmuş promosyon',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Tarih kontrolü hatası',
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

