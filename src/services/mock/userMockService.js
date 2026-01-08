/**
 * User Mock Service
 * Mock user servisleri - standart response contract kullanır
 * Shared user store kullanır
 */

import { mockLoyaltyData } from '../../utils/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
  getUserIdFromToken,
} from './mockUserStore';

/**
 * Response contract helper
 */
const createResponse = (success, data = null, error = null) => ({
  success,
  data,
  error,
});

/**
 * Simüle edilmiş gecikme
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Token'dan kullanıcı bilgilerini al
 * Eğer kullanıcı store'da yoksa, AsyncStorage'dan email'i alıp kullanıcıyı bulur
 */
const getCurrentUser = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    if (!token) {
      return null;
    }
    
    // Önce email'i AsyncStorage'dan al
    const savedEmail = await AsyncStorage.getItem('userEmail');
    if (savedEmail) {
      const user = getUserByEmail(savedEmail);
      if (user) {
        return user;
      }
    }
    
    // Email yoksa token'dan user id çıkar
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return null;
    }
    
    let user = getUserById(userId);
    
    // Eğer kullanıcı store'da yoksa, test kullanıcısını kontrol et
    if (!user) {
      const testUser = getUserByEmail('test@example.com');
      if (testUser && testUser.id === userId) {
        return testUser;
      }
    }
    
    return user;
  } catch (error) {
    console.error('Token alma hatası:', error);
    return null;
  }
};

/**
 * Kullanıcı profil bilgilerini getir (Mock)
 * Login yapmış kullanıcının bilgilerini döndürür
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getProfile = async () => {
  await delay(300 + Math.random() * 400); // 300-700ms

  const user = await getCurrentUser();
  
  if (!user) {
    return createResponse(
      false,
      null,
      {
        code: 'UNAUTHORIZED',
        message: 'Token bulunamadı. Lütfen giriş yapın.',
      }
    );
  }

  // Şifreyi döndürme
  const { password, ...userWithoutPassword } = user;

  return createResponse(
    true,
    {
      id: user.id,
      email: user.email,
      name: user.name,
      fullName: user.fullName || user.name,
      phone: user.phone || '',
      countryCode: user.countryCode || 'TR',
      phoneNumber: user.phoneNumber || user.phone || '',
      notificationsEnabled: user.notificationsEnabled !== undefined ? user.notificationsEnabled : true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    null
  );
};

/**
 * Kullanıcı profil bilgilerini güncelle (Mock)
 * @param {Object} profileData - Güncellenecek profil bilgileri
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const updateProfile = async (profileData) => {
  await delay(400 + Math.random() * 300); // 400-700ms

  const user = await getCurrentUser();
  
  if (!user) {
    return createResponse(
      false,
      null,
      {
        code: 'UNAUTHORIZED',
        message: 'Token bulunamadı. Lütfen giriş yapın.',
      }
    );
  }

  // Email güncelleme kontrolü
  if (profileData.email && profileData.email !== user.email) {
    // Yeni email zaten kullanılıyor mu?
    const existingUser = getUserByEmail(profileData.email);
    if (existingUser && existingUser.id !== user.id) {
      return createResponse(
        false,
        null,
        {
          code: 'EMAIL_EXISTS',
          message: 'Bu email adresi zaten kullanılıyor',
        }
      );
    }
  }

  // Güncelleme
  const updates = {};
  if (profileData.email) updates.email = profileData.email.toLowerCase().trim();
  if (profileData.name) updates.name = profileData.name;
  if (profileData.phone !== undefined) updates.phone = profileData.phone;

  await updateUser(user.email, updates);

  // Güncellenmiş kullanıcıyı al
  const updatedUser = getUserByEmail(updates.email || user.email);
  const { password: _, ...userWithoutPassword } = updatedUser;

  return createResponse(
    true,
    userWithoutPassword,
    null
  );
};

/**
 * Şifre değiştirme (Mock)
 * @param {string} oldPassword - Eski şifre
 * @param {string} newPassword - Yeni şifre
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const updatePassword = async (oldPassword, newPassword) => {
  await delay(400 + Math.random() * 300); // 400-700ms

  const user = await getCurrentUser();
  
  if (!user) {
    return createResponse(
      false,
      null,
      {
        code: 'UNAUTHORIZED',
        message: 'Token bulunamadı. Lütfen giriş yapın.',
      }
    );
  }

  // Eski şifre kontrolü
  if (user.password !== oldPassword) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_PASSWORD',
        message: 'Eski şifre hatalı',
      }
    );
  }

  // Yeni şifre validasyonu
  if (!newPassword || newPassword.length < 8) {
    return createResponse(
      false,
      null,
      {
        code: 'WEAK_PASSWORD',
        message: 'Şifre en az 8 karakter olmalıdır',
      }
    );
  }

  // Şifreyi güncelle
  await updateUser(user.email, { password: newPassword });

  return createResponse(
    true,
    {
      message: 'Şifreniz başarıyla güncellendi',
    },
    null
  );
};

/**
 * Email değiştirme (Mock)
 * @param {string} newEmail - Yeni email
 * @param {string} activationCode - Aktivasyon kodu (mock'ta kontrol edilmez)
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const updateEmail = async (newEmail, activationCode) => {
  await delay(400 + Math.random() * 300); // 400-700ms

  const user = await getCurrentUser();
  
  if (!user) {
    return createResponse(
      false,
      null,
      {
        code: 'UNAUTHORIZED',
        message: 'Token bulunamadı. Lütfen giriş yapın.',
      }
    );
  }

  // Email validasyonu
  if (!newEmail || !newEmail.includes('@')) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_EMAIL',
        message: 'Geçerli bir email adresi giriniz',
      }
    );
  }

  const normalizedEmail = newEmail.toLowerCase().trim();

  // Email zaten kullanılıyor mu?
  const existingUser = getUserByEmail(normalizedEmail);
  if (existingUser && existingUser.id !== user.id) {
    return createResponse(
      false,
      null,
      {
        code: 'EMAIL_EXISTS',
        message: 'Bu email adresi zaten kullanılıyor',
      }
    );
  }

  // Aktivasyon kodu kontrolü (mock'ta her zaman geçerli)
  if (!activationCode || activationCode.length !== 6) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_CODE',
        message: 'Geçerli bir aktivasyon kodu giriniz',
      }
    );
  }

  // Email'i güncelle - updateUser fonksiyonu email değişikliğini handle ediyor
  await updateUser(user.email, { email: normalizedEmail });
  
  // AsyncStorage'daki email'i de güncelle
  try {
    await AsyncStorage.setItem('userEmail', normalizedEmail);
  } catch (error) {
    console.warn('Email güncelleme hatası:', error);
  }

  // Güncellenmiş kullanıcıyı al
  const updatedUser = getUserByEmail(normalizedEmail);
  const { password: _, ...userWithoutPassword } = updatedUser;

  return createResponse(
    true,
    userWithoutPassword,
    null
  );
};

/**
 * Telefon değiştirme (Mock)
 * @param {string} newPhone - Yeni telefon
 * @param {string} activationCode - Aktivasyon kodu (mock'ta kontrol edilmez)
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const updatePhone = async (newPhone, activationCode) => {
  await delay(400 + Math.random() * 300); // 400-700ms

  const user = await getCurrentUser();
  
  if (!user) {
    return createResponse(
      false,
      null,
      {
        code: 'UNAUTHORIZED',
        message: 'Token bulunamadı. Lütfen giriş yapın.',
      }
    );
  }

  // Telefon validasyonu
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  const cleanedPhone = newPhone.replace(/\s/g, '').replace(/[()-]/g, '');
  if (!phoneRegex.test(cleanedPhone)) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_PHONE',
        message: 'Geçerli bir telefon numarası giriniz',
      }
    );
  }

  // Aktivasyon kodu kontrolü (mock'ta her zaman geçerli)
  if (!activationCode || activationCode.length !== 6) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_CODE',
        message: 'Geçerli bir aktivasyon kodu giriniz',
      }
    );
  }

  // Telefonu güncelle
  await updateUser(user.email, { phone: cleanedPhone });

  // Güncellenmiş kullanıcıyı al
  const updatedUser = getUserByEmail(user.email);
  const { password: _, ...userWithoutPassword } = updatedUser;

  return createResponse(
    true,
    userWithoutPassword,
    null
  );
};

/**
 * Bildirim ayarlarını getir (Mock)
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getNotificationSettings = async () => {
  await delay(200 + Math.random() * 200); // 200-400ms

  const user = await getCurrentUser();
  
  if (!user) {
    return createResponse(
      false,
      null,
      {
        code: 'UNAUTHORIZED',
        message: 'Token bulunamadı. Lütfen giriş yapın.',
      }
    );
  }

  return createResponse(
    true,
    {
      notificationsEnabled: user.notificationsEnabled !== undefined ? user.notificationsEnabled : true,
    },
    null
  );
};

/**
 * Bildirim ayarlarını güncelle (Mock)
 * @param {boolean} notificationsEnabled - Bildirimler açık/kapalı
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const updateNotificationSettings = async (notificationsEnabled) => {
  await delay(200 + Math.random() * 200); // 200-400ms

  const user = await getCurrentUser();
  
  if (!user) {
    return createResponse(
      false,
      null,
      {
        code: 'UNAUTHORIZED',
        message: 'Token bulunamadı. Lütfen giriş yapın.',
      }
    );
  }

  // Bildirim ayarını güncelle
  await updateUser(user.email, { notificationsEnabled });

  return createResponse(
    true,
    {
      notificationsEnabled,
      message: 'Bildirim ayarları güncellendi',
    },
    null
  );
};

/**
 * Üyelik iptali (Mock)
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const deleteAccount = async () => {
  await delay(400 + Math.random() * 300); // 400-700ms

  const user = await getCurrentUser();
  
  if (!user) {
    return createResponse(
      false,
      null,
      {
        code: 'UNAUTHORIZED',
        message: 'Token bulunamadı. Lütfen giriş yapın.',
      }
    );
  }

  // Kullanıcıyı sil
  await deleteUser(user.email);

  // Token'ı temizle
  try {
    await AsyncStorage.removeItem('userToken');
  } catch (error) {
    console.error('Token silme hatası:', error);
  }

  return createResponse(
    true,
    {
      message: 'Üyeliğiniz başarıyla iptal edildi',
    },
    null
  );
};

/**
 * Kullanıcının sipariş ve sadakat bilgilerini getir (Mock)
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getUserLoyaltyInfo = async () => {
  await delay(500 + Math.random() * 200); // 500-700ms

  const user = await getCurrentUser();
  
  if (!user) {
    return createResponse(
      false,
      null,
      {
        code: 'UNAUTHORIZED',
        message: 'Token bulunamadı. Lütfen giriş yapın.',
      }
    );
  }

  return createResponse(
    true,
    mockLoyaltyData,
    null
  );
};

/**
 * Ana sayfa verilerini getir (Mock)
 * Kullanıcının gittiği kafeler, sipariş sayıları, ücretsiz ürün eşiği, yakındaki kafeler
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const getHomeData = async () => {
  await delay(400 + Math.random() * 300); // 400-700ms

  const user = await getCurrentUser();
  
  if (!user) {
    return createResponse(
      false,
      null,
      {
        code: 'UNAUTHORIZED',
        message: 'Token bulunamadı. Lütfen giriş yapın.',
      }
    );
  }

  // İlk 5 sadakat bilgisi (en çok sipariş verilenler)
  const topLoyaltyCafes = [...mockLoyaltyData]
    .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
    .slice(0, 5);

  // Yakındaki kafeler (mock)
  const nearbyCafes = [
    {
      id: 1,
      name: 'Starbucks',
      address: 'Kadıköy, İstanbul',
      distance: 0.5,
      hasCampaign: true,
    },
    {
      id: 2,
      name: 'Kahve Dünyası',
      address: 'Beşiktaş, İstanbul',
      distance: 1.2,
      hasCampaign: false,
    },
    {
      id: 3,
      name: 'Gloria Jeans',
      address: 'Şişli, İstanbul',
      distance: 2.5,
      hasCampaign: true,
    },
  ];

  return createResponse(
    true,
    {
      loyaltyCafes: topLoyaltyCafes,
      nearbyCafes: nearbyCafes,
      totalOrders: mockLoyaltyData.reduce((sum, item) => sum + (item.orderCount || 0), 0),
      totalCafes: mockLoyaltyData.length,
    },
    null
  );
};
