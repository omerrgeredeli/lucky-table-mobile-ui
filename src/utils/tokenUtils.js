/**
 * Token Utilities
 * Token'dan kullanıcı bilgilerini çıkarır (role, userId, vb.)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Token'dan role bilgisini çıkarır
 * Mock token format: mock_jwt_token_timestamp_id_email_role
 * Real token: JWT decode edilir
 * 
 * @param {string} token - User token
 * @returns {Promise<string|null>} Role ('customer' veya 'user') veya null
 */
export const getUserRoleFromToken = async (token) => {
  if (!token) {
    return null;
  }

  try {
    const { USE_MOCK_API } = await import('../config/api');
    
    if (USE_MOCK_API) {
      // Mock token format: mock_jwt_token_timestamp_id_email_role
      if (token.startsWith('mock_jwt_token_')) {
        const parts = token.split('_');
        // Format: mock_jwt_token_timestamp_id_email_role
        // En az 6 parça olmalı (mock, jwt, token, timestamp, id, email, role)
        if (parts.length >= 6) {
          const role = parts[parts.length - 1]; // Son parça role
          if (role === 'customer' || role === 'user') {
            return role;
          }
        }
        // Eski token formatında role yoksa, user store'dan kontrol et
        const { getUserIdFromToken, getUserById } = await import('../services/mock/mockUserStore');
        const userId = getUserIdFromToken(token);
        if (userId) {
          const user = getUserById(userId);
          if (user && user.role) {
            return user.role;
          }
        }
        // Varsayılan customer
        return 'customer';
      }
    } else {
      // Real API: JWT decode
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          // JWT payload decode
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          return payload.role || 'customer';
        }
      } catch (error) {
        console.warn('JWT decode error:', error);
      }
    }
    
    // Varsayılan customer
    return 'customer';
  } catch (error) {
    console.error('Role extraction error:', error);
    return 'customer'; // Güvenli varsayılan
  }
};

/**
 * Token'dan userId çıkarır
 * @param {string} token - User token
 * @returns {Promise<number|null>} User ID veya null
 */
export const getUserIdFromToken = async (token) => {
  if (!token) {
    return null;
  }

  try {
    const { USE_MOCK_API } = await import('../config/api');
    
    if (USE_MOCK_API) {
      const { getUserIdFromToken: getUserId } = await import('../services/mock/mockUserStore');
      return getUserId(token);
    } else {
      // Real API: JWT decode
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          return payload.userId || payload.id || null;
        }
      } catch (error) {
        console.warn('JWT decode error:', error);
      }
    }
    
    return null;
  } catch (error) {
    console.error('User ID extraction error:', error);
    return null;
  }
};

