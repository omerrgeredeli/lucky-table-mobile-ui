/**
 * Mock User Store
 * Tüm mock servisler için ortak kullanıcı veri deposu
 * In-memory store - AsyncStorage ile persist edilir
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * In-Memory User Store
 * Format: { email: { id, email, password, name, phone, notificationsEnabled, createdAt, updatedAt } }
 */
const userStore = new Map();

const STORAGE_KEY = 'mockUserStore';

/**
 * Test kullanıcıları (isteğe bağlı - hızlı test için)
 */
const initializeTestUsers = () => {
  // Varsayılan test kullanıcısı
  userStore.set('test@example.com', {
    id: 1,
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    phone: '+90 555 123 4567',
    notificationsEnabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
};

/**
 * Store'u AsyncStorage'dan yükle
 */
const loadStoreFromStorage = async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const users = JSON.parse(stored);
      userStore.clear();
      users.forEach(user => {
        userStore.set(user.email.toLowerCase().trim(), user);
      });
    } else {
      // İlk yüklemede test kullanıcılarını ekle
      initializeTestUsers();
      await saveStoreToStorage();
    }
  } catch (error) {
    console.error('Error loading store from storage:', error);
    // Hata durumunda test kullanıcılarını yükle
    initializeTestUsers();
  }
};

/**
 * Store'u AsyncStorage'a kaydet
 */
const saveStoreToStorage = async () => {
  try {
    const users = Array.from(userStore.values());
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving store to storage:', error);
  }
};

// Uygulama başladığında store'u yükle
if (typeof window !== 'undefined') {
  loadStoreFromStorage();
} else {
  // React Native'de de yükle
  loadStoreFromStorage();
}

/**
 * Kullanıcı bul (email ile)
 */
export const getUserByEmail = (email) => {
  const normalizedEmail = email?.toLowerCase().trim();
  return userStore.get(normalizedEmail);
};

/**
 * Kullanıcı bul (id ile)
 */
export const getUserById = (id) => {
  for (const user of userStore.values()) {
    if (user.id === id) {
      return user;
    }
  }
  return null;
};

/**
 * Kullanıcı ekle
 */
export const addUser = async (user) => {
  const normalizedEmail = user.email.toLowerCase().trim();
  userStore.set(normalizedEmail, {
    ...user,
    email: normalizedEmail,
    createdAt: user.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await saveStoreToStorage();
};

/**
 * Kullanıcı güncelle
 * Email değişikliği durumunda eski email'i sil, yeni email ile ekle
 */
export const updateUser = async (email, updates) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = userStore.get(normalizedEmail);
  if (user) {
    // Email değişikliği varsa, eski email'i sil ve yeni email ile ekle
    if (updates.email && updates.email !== normalizedEmail) {
      const newEmail = updates.email.toLowerCase().trim();
      const updatedUser = {
        ...user,
        ...updates,
        email: newEmail,
        updatedAt: new Date().toISOString(),
      };
      userStore.delete(normalizedEmail);
      userStore.set(newEmail, updatedUser);
      await saveStoreToStorage();
      return true;
    } else {
      // Normal güncelleme
      userStore.set(normalizedEmail, {
        ...user,
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      await saveStoreToStorage();
      return true;
    }
  }
  return false;
};

/**
 * Kullanıcı sil
 */
export const deleteUser = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const deleted = userStore.delete(normalizedEmail);
  if (deleted) {
    await saveStoreToStorage();
  }
  return deleted;
};

/**
 * Email kontrolü (kayıtlı mı?)
 */
export const hasUser = (email) => {
  const normalizedEmail = email?.toLowerCase().trim();
  return userStore.has(normalizedEmail);
};

/**
 * Tüm kullanıcıları getir (debug için)
 */
export const getAllUsers = () => {
  return Array.from(userStore.values());
};

/**
 * Store'u temizle (debug için)
 */
export const clearStore = () => {
  userStore.clear();
  initializeTestUsers();
};

/**
 * Token'dan user id çıkar (mock token format: mock_jwt_token_timestamp_id)
 */
export const getUserIdFromToken = (token) => {
  if (!token || !token.startsWith('mock_jwt_token_')) {
    return null;
  }
  const parts = token.split('_');
  return parts.length > 3 ? parseInt(parts[parts.length - 1], 10) : null;
};

export {
  userStore,
  initializeTestUsers,
  loadStoreFromStorage,
  saveStoreToStorage,
};

