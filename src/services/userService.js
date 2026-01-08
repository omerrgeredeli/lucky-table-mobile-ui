/**
 * User Service - Service Switch Layer
 * Mock ve gerçek API arasında geçiş yapar
 * Tüm screen'ler bu servisi kullanır
 */

import { USE_MOCK_API } from '../config/api';
import * as mockService from './mock/userMockService';
import * as apiService from './api/userApiService';

/**
 * Service switch - USE_MOCK_API flag'ine göre mock veya real servis kullanır
 */
const getService = () => (USE_MOCK_API ? mockService : apiService);

/**
 * Kullanıcı profil bilgilerini getir
 * @returns {Promise<Object>} Kullanıcı bilgileri
 */
export const getUserProfile = async () => {
  const service = getService();
  const response = await service.getProfile();

  // Screen'ler için backward compatibility - hata durumunda throw et
  if (!response.success) {
    throw new Error(response.error?.message || 'Profil bilgileri alınamadı');
    }

  return response.data;
};

/**
 * Kullanıcı profil bilgilerini güncelle
 * @param {Object} profileData - Güncellenecek profil bilgileri
 * @returns {Promise<Object>} Güncellenmiş kullanıcı bilgileri
 */
export const updateUserProfile = async (profileData) => {
  const service = getService();
  const response = await service.updateProfile(profileData);

  // Screen'ler için backward compatibility - hata durumunda throw et
  if (!response.success) {
    throw new Error(response.error?.message || 'Profil güncelleme başarısız');
    }

  return response.data;
};

/**
 * Kullanıcının sipariş ve sadakat bilgilerini getir
 * @returns {Promise<Array>} Kafe ve sipariş bilgileri listesi
 */
export const getUserLoyaltyInfo = async () => {
  const service = getService();
  const response = await service.getUserLoyaltyInfo();

  // Screen'ler için backward compatibility - hata durumunda throw et
  if (!response.success) {
    throw new Error(response.error?.message || 'Sadakat bilgileri alınamadı');
  }

  return response.data;
};

/**
 * Ana sayfa verilerini getir
 * Kullanıcının gittiği kafeler, sipariş sayıları, ücretsiz ürün eşiği, yakındaki kafeler
 * @returns {Promise<Object>} Ana sayfa verileri
 */
export const getHomeData = async () => {
  const service = getService();
  const response = await service.getHomeData();
    
  // Screen'ler için backward compatibility - hata durumunda throw et
  if (!response.success) {
    throw new Error(response.error?.message || 'Ana sayfa verileri alınamadı');
    }

  return response.data;
};

/**
 * Şifre değiştirme
 * @param {string} oldPassword - Eski şifre
 * @param {string} newPassword - Yeni şifre
 * @returns {Promise<Object>} Sonuç
 */
export const updatePassword = async (oldPassword, newPassword) => {
  const service = getService();
  const response = await service.updatePassword(oldPassword, newPassword);

  if (!response.success) {
    throw new Error(response.error?.message || 'Şifre güncelleme başarısız');
  }

  return response.data;
};

/**
 * Email değiştirme
 * @param {string} newEmail - Yeni email
 * @param {string} activationCode - Aktivasyon kodu
 * @returns {Promise<Object>} Güncellenmiş kullanıcı bilgileri
 */
export const updateEmail = async (newEmail, activationCode) => {
  const service = getService();
  const response = await service.updateEmail(newEmail, activationCode);

  if (!response.success) {
    throw new Error(response.error?.message || 'Email güncelleme başarısız');
  }

  return response.data;
};

/**
 * Telefon değiştirme
 * @param {string} newPhone - Yeni telefon
 * @param {string} activationCode - Aktivasyon kodu
 * @returns {Promise<Object>} Güncellenmiş kullanıcı bilgileri
 */
export const updatePhone = async (newPhone, activationCode) => {
  const service = getService();
  const response = await service.updatePhone(newPhone, activationCode);

  if (!response.success) {
    throw new Error(response.error?.message || 'Telefon güncelleme başarısız');
  }

  return response.data;
};

/**
 * Bildirim ayarlarını getir
 * @returns {Promise<Object>} Bildirim ayarları
 */
export const getNotificationSettings = async () => {
  const service = getService();
  const response = await service.getNotificationSettings();

  if (!response.success) {
    throw new Error(response.error?.message || 'Bildirim ayarları alınamadı');
  }

  return response.data;
};

/**
 * Bildirim ayarlarını güncelle
 * @param {boolean} notificationsEnabled - Bildirimler açık/kapalı
 * @returns {Promise<Object>} Sonuç
 */
export const updateNotificationSettings = async (notificationsEnabled) => {
  const service = getService();
  const response = await service.updateNotificationSettings(notificationsEnabled);

  if (!response.success) {
    throw new Error(response.error?.message || 'Bildirim ayarları güncelleme başarısız');
      }

  return response.data;
};

/**
 * Üyelik iptali
 * @returns {Promise<Object>} Sonuç
 */
export const deleteAccount = async () => {
  const service = getService();
  const response = await service.deleteAccount();

  if (!response.success) {
    throw new Error(response.error?.message || 'Üyelik iptali başarısız');
    }
    
  return response.data;
};
