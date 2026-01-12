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

    // Base64 encode (URL-safe)
    const base64UrlEncode = (str) => {
      // Web'de btoa kullan, native'de de btoa polyfill genellikle mevcuttur
      const jsonStr = JSON.stringify(str);
      let base64;
      if (Platform.OS === 'web' && typeof btoa !== 'undefined') {
        base64 = btoa(jsonStr);
      } else if (typeof btoa !== 'undefined') {
        // React Native'de btoa polyfill genellikle mevcuttur
        base64 = btoa(jsonStr);
      } else {
        // Fallback: manual base64 encoding (basit versiyon)
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
    
    // HEX'i base64'e çevir
    // React Native'de HEX'i base64'e çevirmek için:
    // 1. HEX string'i byte array'e çevir
    // 2. Byte array'i base64'e çevir
    const hexToBase64 = (hex) => {
      const bytes = [];
      for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substr(i, 2), 16));
      }
      // Byte array'i base64'e çevir
      const binary = String.fromCharCode(...bytes);
      if (typeof btoa !== 'undefined') {
        return btoa(binary);
      } else {
        // Fallback: manual base64 (yukarıdaki gibi)
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

    // Token'ı birleştir
    const token = `${encodedHeader}.${encodedPayload}.${signature}`;

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
 * PAYLOAD VALIDATION ile güvenli
 * 
 * @param {Object} promotionData - Promosyon bilgileri
 * @param {number} userId - Kullanıcı ID
 * @returns {Promise<string>} QR token
 */
export const generatePromotionQRToken = async (promotionData, userId) => {
  // PAYLOAD VALIDATION - Gerekli alanları kontrol et
  if (!promotionData || typeof promotionData !== 'object') {
    throw new Error('Promosyon bilgisi geçersiz');
  }

  // Required fields kontrolü
  const requiredFields = {
    promotionId: promotionData.promotionId,
    venueName: promotionData.venueName,
    promotionExpireDate: promotionData.promotionExpireDate,
  };

  const missingFields = [];
  for (const [field, value] of Object.entries(requiredFields)) {
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    throw new Error(`Eksik alanlar: ${missingFields.join(', ')}`);
  }

  // userId kontrolü
  if (!userId || (typeof userId !== 'number' && typeof userId !== 'string')) {
    throw new Error('Kullanıcı ID geçersiz');
  }

  // Payload oluştur - try/catch ile stringify güvenliği
  let payload;
  try {
    payload = {
      promotionId: promotionData.promotionId,
      userId: userId,
      venueName: String(promotionData.venueName), // String'e çevir
      promotionType: promotionData.promotionType || 'FREE_COFFEE',
      promotionExpireDate: String(promotionData.promotionExpireDate), // String'e çevir
      isUsed: false, // QR kod oluşturulurken her zaman false
    };
  } catch (error) {
    throw new Error(`Payload oluşturulamadı: ${error.message}`);
  }

  // Token geçerlilik süresi: promosyon bitiş tarihine kadar
  let expiresIn = 3600; // Default 1 saat
  try {
    const expireDate = new Date(promotionData.promotionExpireDate);
    const now = new Date();
    
    if (isNaN(expireDate.getTime())) {
      throw new Error('Geçersiz tarih formatı');
    }
    
    expiresIn = Math.max(3600, Math.floor((expireDate - now) / 1000)); // En az 1 saat
  } catch (error) {
    console.warn('Tarih hesaplama hatası, varsayılan süre kullanılıyor:', error);
    expiresIn = 3600;
  }

  // QR Token oluştur - try/catch ile sarılmış
  try {
    return await generateQRToken(payload, expiresIn);
  } catch (error) {
    throw new Error(`QR token oluşturulamadı: ${error.message || 'Bilinmeyen hata'}`);
  }
};

