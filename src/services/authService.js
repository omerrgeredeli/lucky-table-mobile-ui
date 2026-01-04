/**
 * Auth Service - Service Switch Layer
 * Mock ve gerçek API arasında geçiş yapar
 * Tüm screen'ler bu servisi kullanır
 */

import { USE_MOCK_API } from '../config/api';
import * as mockService from './mock/authMockService';
import * as apiService from './api/authApiService';

/**
 * Service switch - USE_MOCK_API flag'ine göre mock veya real servis kullanır
 */
const getService = () => (USE_MOCK_API ? mockService : apiService);

/**
 * Kullanıcı giriş işlemi
 * @param {string} email - Kullanıcı email'i
 * @param {string} password - Kullanıcı şifresi
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const login = async (email, password) => {
  const service = getService();
  const response = await service.login(email, password);

  // Screen'ler için backward compatibility - hata durumunda throw et
  if (!response.success) {
    throw new Error(response.error?.message || 'Giriş işlemi başarısız');
  }

  return response.data;
};

/**
 * Kullanıcı kayıt işlemi
 * @param {string} email - Kullanıcı email'i
 * @param {string} password - Kullanıcı şifresi
 * @param {string} phone - Telefon numarası (opsiyonel)
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const signup = async (email, password, phone = '') => {
  const service = getService();
  const response = await service.signup(email, password, phone);

  // Screen'ler için backward compatibility - hata durumunda throw et
  if (!response.success) {
    throw new Error(response.error?.message || 'Kayıt işlemi başarısız');
  }

  return response.data;
};

/**
 * Şifre sıfırlama isteği
 * @param {string} email - Kullanıcı email'i
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const forgotPassword = async (email) => {
  const service = getService();
  const response = await service.forgotPassword(email);

  // Screen'ler için backward compatibility - hata durumunda throw et
  if (!response.success) {
    throw new Error(response.error?.message || 'Şifre sıfırlama isteği başarısız');
  }

  return response.data;
};

/**
 * Aktivasyon kodu gönderme
 * @param {string} emailOrPhone - Email veya telefon
 * @returns {Promise<Object>} Sonuç
 */
export const sendActivationCode = async (emailOrPhone) => {
  const service = getService();
  
  // Mock servis için sendActivationCode varsa kullan
  if (service.sendActivationCode) {
    const response = await service.sendActivationCode(emailOrPhone);
    if (!response.success) {
      throw new Error(response.error?.message || 'Aktivasyon kodu gönderilemedi');
    }
    return response.data;
  }
  
  // Real API için (henüz implement edilmedi)
  throw new Error('Aktivasyon kodu gönderme henüz implement edilmedi');
};
