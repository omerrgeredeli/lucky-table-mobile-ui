/**
 * QR Token Service
 * Promosyon QR kodları için JWT benzeri imzalı token üretir
 * Mock ve gerçek ortam için hazır
 */

import { Platform } from 'react-native';
import { USE_MOCK_API } from '../config/api';

// expo-crypto import - Web için fallback
let Crypto;
if (Platform.OS !== 'web') {
  Crypto = require('expo-crypto');
} else {
  // Web için crypto API kullan
  Crypto = {
    digestStringAsync: async (algorithm, data) => {
      // Web'de SubtleCrypto API kullan
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },
    CryptoDigestAlgorithm: {
      SHA256: 'SHA256',
    },
  };
}

/**
 * JWT benzeri token üretir
 * Format: header.payload.signature
 * 
 * @param {Object} payload - Token içinde taşınacak veriler
 * @param {number} expiresIn - Token geçerlilik süresi (saniye)
 * @returns {Promise<string>} JWT benzeri token
 */
export const generateQRToken = async (payload, expiresIn = 3600) => {
  try {
    // Secret key - Mock ve gerçek ortam için farklı
    const secret = USE_MOCK_API 
      ? 'mock_qr_secret_key_for_testing_only' 
      : process.env.QR_TOKEN_SECRET || 'production_qr_secret_key';

    // Header
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    // Payload - expire date ekle
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now, // Issued at
      exp: now + expiresIn, // Expiration
    };

    // Base64 encode (URL-safe) - Platform bağımsız, her zaman aynı encoding
    const base64UrlEncode = (str) => {
      // JSON.stringify - her platformda aynı sonuç
      const jsonStr = JSON.stringify(str);
      
      // Base64 encoding - platform bağımsız, her zaman aynı algoritma
      // React Native ve Web'de btoa polyfill mevcuttur, aynı sonucu verir
      let base64;
      if (typeof btoa !== 'undefined') {
        base64 = btoa(jsonStr);
      } else {
        // Fallback: manual base64 encoding (her platformda aynı sonuç)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        while (i < jsonStr.length) {
          const a = jsonStr.charCodeAt(i++);
          const b = i < jsonStr.length ? jsonStr.charCodeAt(i++) : 0;
          const c = i < jsonStr.length ? jsonStr.charCodeAt(i++) : 0;
          const bitmap = (a << 16) | (b << 8) | c;
          result += chars.charAt((bitmap >> 18) & 63);
          result += chars.charAt((bitmap >> 12) & 63);
          result += i - 2 < jsonStr.length ? chars.charAt((bitmap >> 6) & 63) : '=';
          result += i - 1 < jsonStr.length ? chars.charAt(bitmap & 63) : '=';
        }
        base64 = result;
      }
      
      // URL-safe base64 (her platformda aynı)
      return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(tokenPayload);

    // Signature oluştur (HMAC-SHA256)
    // HMAC için: secret + message şeklinde hash alıyoruz
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const hashString = `${signatureInput}.${secret}`;
    
    // SHA256 hash al (HEX formatında döner)
    const hashHex = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hashString
    );
    
    // HEX'i base64'e çevir - Platform bağımsız, her zaman aynı algoritma
    const hexToBase64 = (hex) => {
      // HEX string'i byte array'e çevir (her platformda aynı)
      const bytes = [];
      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
      }
      // Byte array'i base64'e çevir
      const binary = String.fromCharCode(...bytes);
      if (typeof btoa !== 'undefined') {
        return btoa(binary);
      } else {
        // Fallback: manual base64 (her platformda aynı sonuç)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        while (i < binary.length) {
          const a = binary.charCodeAt(i++);
          const b = i < binary.length ? binary.charCodeAt(i++) : 0;
          const c = i < binary.length ? binary.charCodeAt(i++) : 0;
          const bitmap = (a << 16) | (b << 8) | c;
          result += chars.charAt((bitmap >> 18) & 63);
          result += chars.charAt((bitmap >> 12) & 63);
          result += i - 2 < binary.length ? chars.charAt((bitmap >> 6) & 63) : '=';
          result += i - 1 < binary.length ? chars.charAt(bitmap & 63) : '=';
        }
        return result;
      }
    };
    
    const base64 = hexToBase64(hashHex);
    
    // Base64 URL-safe encode
    const signature = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // Token'ı birleştir - Platform bağımsız, her zaman aynı format
    const token = `${encodedHeader}.${encodedPayload}.${signature}`;

    // Token üretimini logla (debug için)
    if (__DEV__ || process.env.NODE_ENV !== 'production') {
      console.log('=== QR TOKEN GENERATED ===');
      console.log('Token Length:', token.length);
      console.log('Token Preview:', token.substring(0, 50) + '...');
      console.log('Token Format:', token.split('.').length === 3 ? 'JWT (Valid)' : 'Invalid');
      console.log('==========================');
    }

    return token;
  } catch (error) {
    console.error('QR Token generation error:', error);
    throw new Error('QR token oluşturulamadı');
  }
};

/**
 * QR Token'ı parse eder ve doğrular
 * 
 * @param {string} token - JWT benzeri token
 * @returns {Promise<Object|null>} Parse edilmiş payload veya null
 */
export const verifyQRToken = async (token) => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;

    // Secret key
    const secret = USE_MOCK_API 
      ? 'mock_qr_secret_key_for_testing_only' 
      : process.env.QR_TOKEN_SECRET || 'production_qr_secret_key';

    // Signature doğrulama
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const hashString = `${signatureInput}.${secret}`;
    
    // SHA256 hash al (HEX formatında döner)
    const hashHex = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hashString
    );
    
    // HEX'i base64'e çevir
    const hexToBase64 = (hex) => {
      const bytes = [];
      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
      }
      const binary = String.fromCharCode(...bytes);
      return btoa(binary);
    };
    
    const base64 = hexToBase64(hashHex);
    
    // Base64 URL-safe encode
    const expectedSignature = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (signature !== expectedSignature) {
      console.warn('QR Token signature mismatch');
      return null;
    }

    // Payload decode
    const base64UrlDecode = (str) => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const padding = base64.length % 4;
      if (padding) {
        base64 += '='.repeat(4 - padding);
      }
      let decoded;
      if (typeof atob !== 'undefined') {
        decoded = atob(base64);
      } else {
        // Fallback: manual base64 decode (basit versiyon)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        let result = '';
        let i = 0;
        base64 = base64.replace(/[^A-Za-z0-9\+\/]/g, '');
        while (i < base64.length) {
          const encoded1 = chars.indexOf(base64.charAt(i++));
          const encoded2 = chars.indexOf(base64.charAt(i++));
          const encoded3 = chars.indexOf(base64.charAt(i++));
          const encoded4 = chars.indexOf(base64.charAt(i++));
          const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
          result += String.fromCharCode((bitmap >> 16) & 255);
          if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
          if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
        }
        decoded = result;
      }
      return JSON.parse(decoded);
    };

    const payload = base64UrlDecode(encodedPayload);

    // Expiration kontrolü
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      console.warn('QR Token expired');
      return null;
    }

    return payload;
  } catch (error) {
    console.error('QR Token verification error:', error);
    return null;
  }
};

/**
 * Promosyon QR kodu için token üretir
 * ORTAK PAYLOAD YAPISI kullanır
 * PAYLOAD VALIDATION ile güvenli
 * TÜM BİLGİLER MOCK OLARAK ÜRETİLİR (SADECE promotionId KULLANICI TARAFINDAN SEÇİLİR)
 * 
 * @param {string|number} promotionId - Promosyon ID (SADECE BU PARAMETRE)
 * @param {string|number} userId - Kullanıcı ID (optional, mock üretilebilir)
 * @returns {Promise<string>} QR token (JWT formatında)
 */
export const generatePromotionQRToken = async (promotionId, userId = null) => {
  // PAYLOAD VALIDATION - PromotionId kontrolü
  if (!promotionId || (typeof promotionId !== 'number' && typeof promotionId !== 'string')) {
    throw new Error('Promosyon ID geçersiz');
  }

  // MOCK DATA - Tüm bilgiler otomatik üretilir
  const mockUserId = userId || Math.floor(Math.random() * 1000000) + 1; // Mock kullanıcı ID
  const mockVenueName = 'Mock Venue Cafe'; // Mock işletme adı
  const mockBusinessId = `BUSINESS_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const mockPromotionType = 'FREE_COFFEE'; // Mock promosyon tipi
  
  // Mock tarih: 30 gün sonra expire
  const mockExpireDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Nonce üret (unique identifier)
  const nonce = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  // Tarih hesaplamaları
  const createdAt = new Date().toISOString();
  const expiresAt = mockExpireDate.toISOString();

  // TEK VE ZORUNLU QR PAYLOAD ŞEMASI - Customer için PROMOTION
  let payload;
  try {
    payload = {
      qrType: 'PROMOTION', // ZORUNLU
      promoId: String(promotionId), // Kullanıcının seçtiği promosyon ID
      orderId: null, // PROMOTION için null
      customerId: String(mockUserId), // Mock userId -> customerId
      businessId: String(mockBusinessId), // Mock businessId
      businessName: mockVenueName, // Mock businessName
      promoType: mockPromotionType, // Mock promoType
      orderTypes: null, // PROMOTION için null
      createdAt: createdAt, // MOCK
      expiresAt: expiresAt, // MOCK
      used: false, // QR kod oluşturulurken her zaman false
      nonce: nonce, // MOCK
    };
  } catch (error) {
    throw new Error(`Payload oluşturulamadı: ${error.message}`);
  }

  // Token geçerlilik süresi: promosyon bitiş tarihine kadar
  let expiresIn = 3600; // Default 1 saat
  try {
    const expireDate = new Date(expiresAt);
    const now = new Date();
    expiresIn = Math.max(3600, Math.floor((expireDate.getTime() - now.getTime()) / 1000)); // En az 1 saat
  } catch (error) {
    console.warn('Tarih hesaplama hatası, varsayılan süre kullanılıyor:', error);
    expiresIn = 3600;
  }

  // QR Token oluştur - try/catch ile sarılmış
  try {
    const qrToken = await generateQRToken(payload, expiresIn);
    
    if (!qrToken || typeof qrToken !== 'string' || !qrToken.includes('.')) {
      throw new Error('JWT token geçersiz format');
    }
    
    return qrToken;
  } catch (error) {
    throw new Error(`QR token oluşturulamadı: ${error.message || 'Bilinmeyen hata'}`);
  }
};

