import { API_BASE_URL, USE_MOCK_DATA, IS_DEVELOPMENT } from '../config/api';
import { mockLoginResponse, mockSignupResponse } from '../utils/mockData';

/**
 * Auth Service - Authentication ile ilgili API çağrıları
 */

/**
 * Kullanıcı kayıt işlemi
 * @param {string} email - Kullanıcı email'i
 * @param {string} password - Kullanıcı şifresi
 * @returns {Promise<Object>} API response
 */
export const signup = async (email, password) => {
  // Mock data kullan
  if (USE_MOCK_DATA) {
    if (IS_DEVELOPMENT) {
      console.log('📦 Using mock signup response');
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockSignupResponse(email, password);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Kayıt işlemi başarısız (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    
    // Network veya CORS hatası - mock data kullan
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      if (IS_DEVELOPMENT) {
        console.warn('⚠️ Backend bağlantısı kurulamadı, mock data kullanılıyor');
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
      return mockSignupResponse(email, password);
    }
    
    throw error;
  }
};

/**
 * Kullanıcı giriş işlemi
 * @param {string} email - Kullanıcı email'i
 * @param {string} password - Kullanıcı şifresi
 * @returns {Promise<Object>} API response (token içerir)
 */
export const login = async (email, password) => {
  // Mock data kullan
  if (USE_MOCK_DATA) {
    if (IS_DEVELOPMENT) {
      console.log('📦 Using mock login response');
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
    return mockLoginResponse(email, password);
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Giriş işlemi başarısız (${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    
    // Network veya CORS hatası - mock data kullan
    if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
      if (IS_DEVELOPMENT) {
        console.warn('⚠️ Backend bağlantısı kurulamadı, mock data kullanılıyor');
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
      return mockLoginResponse(email, password);
    }
    
    throw error;
  }
};

/**
 * Şifre sıfırlama isteği
 * @param {string} email - Kullanıcı email'i
 * @returns {Promise<Object>} API response
 */
export const forgotPassword = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Şifre sıfırlama isteği başarısız');
    }

    return data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

