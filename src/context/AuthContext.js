import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Auth Context oluşturuluyor
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // Uygulama başlangıcında token kontrolü
  useEffect(() => {
    checkAuthState();
  }, []);

  // AsyncStorage'dan token kontrolü
  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        setUserToken(token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Token kontrolü hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login - token'ı kaydet
  const login = async (token) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login hatası:', error);
      throw error;
    }
  };

  // Logout - token'ı sil
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout hatası:', error);
      throw error;
    }
  };

  const value = {
    isAuthenticated,
    isLoading,
    userToken,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

