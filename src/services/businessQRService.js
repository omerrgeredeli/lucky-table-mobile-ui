/**
 * Business QR Service
 * İşletme kullanıcıları için QR kod üretme ve okuma servisleri
 * Mock ve real API uyumlu
 * TÜM QR KODLAR JWT TOKEN FORMATINDA ÜRETİLİR
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
 * JWT TOKEN FORMATINDA üretilir (güvenli ve standart)
 * ORTAK PAYLOAD YAPISI kullanır
 * PAYLOAD VALIDATION ile güvenli
 * TÜM BİLGİLER MOCK OLARAK ÜRETİLİR (SADECE orderTypes KULLANICI TARAFINDAN SEÇİLİR)
 * 
 * @param {Array<string>} orderTypes - Seçilen yiyecek/içecek tipleri (SADECE BU PARAMETRE)
 * @returns {Promise<string>} QR kod JWT token (header.payload.signature)
 */
export const generateBusinessQRCode = async (orderTypes) => {
  // PAYLOAD VALIDATION - Gerekli alanları kontrol et
  if (!orderTypes || !Array.isArray(orderTypes) || orderTypes.length === 0) {
    throw new Error('Sipariş tipi seçilmedi');
  }

  // MOCK DATA - Tüm bilgiler otomatik üretilir
  const mockBusinessName = 'Mock Business Cafe'; // Mock işletme adı
  const mockUserId = Math.floor(Math.random() * 1000000) + 1; // Mock kullanıcı ID
  const mockBusinessId = `BUSINESS_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

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
      orderId: orderId, // ORDER için orderId (MOCK)
      customerId: String(mockUserId), // Mock userId -> customerId
      businessId: String(mockBusinessId), // Mock businessId
      businessName: String(mockBusinessName), // Mock businessName
      promoType: null, // ORDER için null
      orderTypes: orderTypes.map(ot => String(ot)), // Kullanıcının seçtiği yiyecek/içecek tipleri
      createdAt: createdAt, // MOCK
      expiresAt: expiresAt, // MOCK
      used: false, // QR kod oluşturulurken her zaman false
      nonce: nonce, // MOCK
    };
  } catch (error) {
    throw new Error(`Payload oluşturulamadı: ${error.message}`);
  }

  // JWT Token üret - generateQRToken kullan
  try {
    const { generateQRToken } = await import('./qrTokenService');
    // Token geçerlilik süresi: 24 saat (expiresAt'e kadar)
    const expiresIn = 24 * 60 * 60; // 24 saat (saniye cinsinden)
    const qrToken = await generateQRToken(qrPayload, expiresIn);
    
    if (!qrToken || typeof qrToken !== 'string' || !qrToken.includes('.')) {
      throw new Error('JWT token üretilemedi');
    }
    
    return qrToken;
  } catch (error) {
    throw new Error(`QR token oluşturulamadı: ${error.message || 'Bilinmeyen hata'}`);
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
 * SADECE JWT TOKEN FORMATI kabul edilir
 * ORTAK PAYLOAD YAPISI kullanır
 */
const scanPromotionQRCodeMock = async (qrData, userToken) => {
  // QR kod içeriği MUTLAKA JWT token formatında olmalı
  // JWT format kontrolü: 3 parça olmalı (header.payload.signature)
  if (!qrData || typeof qrData !== 'string') {
    return {
      success: false,
      error: 'Geçersiz QR kodu formatı',
    };
  }

  // JWT token format kontrolü: en az 2 nokta içermeli
  const parts = qrData.split('.');
  if (parts.length !== 3) {
    return {
      success: false,
      error: 'QR kod JWT token formatında değil. Beklenen format: header.payload.signature',
    };
  }

  // Token'ı parse et ve doğrula
  const { verifyQRToken } = await import('./qrTokenService');
  const payload = await verifyQRToken(qrData);
  
  if (!payload) {
    // JWT token doğrulama başarısız
    return {
      success: false,
      error: 'Geçersiz veya süresi dolmuş QR kodu',
    };
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

