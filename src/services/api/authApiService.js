/**
 * Auth API Service
 * Gerçek Spring backend authentication servisleri - standart response contract kullanır
 */

import { API_BASE_URL } from '../../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Response contract helper
 */
const createResponse = (success, data = null, error = null) => ({
  success,
  data,
  error,
});

/**
 * API çağrısı helper
 */
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return createResponse(
        false,
        null,
        {
          code: data.code || `HTTP_${response.status}`,
          message: data.message || `İstek başarısız (${response.status})`,
        }
      );
    }

    // Backend'den gelen response'u standart formata çevir
    // Eğer backend zaten standart format kullanıyorsa direkt döndür
    if (data.success !== undefined) {
      return data;
    }

    // Backend standart format kullanmıyorsa, başarılı response olarak wrap et
    return createResponse(true, data, null);
  } catch (error) {
    console.error('API call error:', error);
    return createResponse(
      false,
      null,
      {
        code: 'NETWORK_ERROR',
        message: error.message || 'Bağlantı hatası oluştu',
      }
    );
  }
};

/**
 * Kullanıcı giriş işlemi
 * @param {string} email - Kullanıcı email'i
 * @param {string} password - Kullanıcı şifresi
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const login = async (email, password) => {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Başarılı ise token'ı kaydet
  if (response.success && response.data?.token) {
    try {
      await AsyncStorage.setItem('userToken', response.data.token);
    } catch (error) {
      console.error('Token kaydetme hatası:', error);
    }
  }

  return response;
};

/**
 * Kullanıcı kayıt işlemi
 * @param {string} email - Kullanıcı email'i
 * @param {string} password - Kullanıcı şifresi
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const signup = async (email, password) => {
  const response = await apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  // Başarılı ise token'ı kaydet
  if (response.success && response.data?.token) {
    try {
      await AsyncStorage.setItem('userToken', response.data.token);
    } catch (error) {
      console.error('Token kaydetme hatası:', error);
    }
  }

  return response;
};

/**
 * Şifre sıfırlama isteği
 * @param {string} email - Kullanıcı email'i
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const forgotPassword = async (email) => {
  return await apiCall('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

