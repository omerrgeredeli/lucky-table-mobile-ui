import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserRoleFromToken } from '../utils/tokenUtils';

// Auth Context oluşturuluyor
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'customer' veya 'user'

  // Uygulama başlangıcında token kontrolü
  useEffect(() => {
    checkAuthState();
  }, []);

  // AsyncStorage'dan token kontrolü
  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        // Token geçerliliğini kontrol et (mock modunda her zaman geçerli)
        try {
          const { USE_MOCK_API } = await import('../config/api');
          if (USE_MOCK_API) {
            // Mock modunda: Store'u yükle ve token varsa geçerli kabul et
            try {
              const { loadStoreFromStorage } = await import('../services/mock/mockUserStore');
              await loadStoreFromStorage();
            } catch (error) {
              console.warn('Store load error (non-critical):', error);
            }
            // Mock modunda token varsa geçerli kabul et
            setUserToken(token);
            setIsAuthenticated(true);
            // Role'ü token'dan çıkar
            const role = await getUserRoleFromToken(token);
            setUserRole(role);
          } else {
            // Real API modunda token'ı validate et (şimdilik sadece varlığını kontrol et)
            setUserToken(token);
            setIsAuthenticated(true);
            // Role'ü token'dan çıkar
            const role = await getUserRoleFromToken(token);
            setUserRole(role);
          }
        } catch (error) {
          console.warn('Token validation error:', error);
          // Sadece kritik hatalarda token'ı temizle (import hatası gibi)
          // Normal validation hatalarında token'ı koru
          if (error.message && error.message.includes('Cannot find module')) {
            // Module bulunamadı hatası - token'ı koru
            setUserToken(token);
            setIsAuthenticated(true);
            const role = await getUserRoleFromToken(token);
            setUserRole(role);
          } else {
            // Diğer hatalarda token'ı temizle
            await AsyncStorage.removeItem('userToken');
            setUserToken(null);
            setIsAuthenticated(false);
            setUserRole(null);
          }
        }
      }
    } catch (error) {
      console.error('Token kontrolü hatası:', error);
      // Hata durumunda authenticated değil ama token'ı silme (crash sonrası recovery için)
      // setUserToken(null);
      // setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Login - token'ı kaydet ve role'ü çıkar
  const login = async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      setIsAuthenticated(true);
      // Role'ü token'dan çıkar
      const role = await getUserRoleFromToken(token);
      setUserRole(role);
    } catch (error) {
      console.error('Login hatası:', error);
      throw error;
    }
  };

  // Logout - token'ı sil ve role'ü temizle
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
      setIsAuthenticated(false);
      setUserRole(null);
    } catch (error) {
      console.error('Logout hatası:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    userToken,
    userRole, // 'customer' veya 'user'
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

