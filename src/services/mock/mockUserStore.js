/**
 * Mock User Store
 * Tüm mock servisler için ortak kullanıcı veri deposu
 * In-memory store - AsyncStorage ile persist edilir
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * In-Memory User Store
 * Format: { email: { id, email, password, name, fullName, phone, countryCode, phoneNumber, notificationsEnabled, role, createdAt, updatedAt } }
 * role: 'customer' (müşteri) veya 'user' (işletme)
 */
const userStore = new Map();

const STORAGE_KEY = 'mockUserStore';

/**
 * Test kullanıcıları (isteğe bağlı - hızlı test için)
 */
const initializeTestUsers = () => {
  // Varsayılan test kullanıcısı (customer)
  userStore.set('test@example.com', {
    id: 1,
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User',
    fullName: 'Test User',
    phone: '5551234567',
    countryCode: 'TR',
    phoneNumber: '5551234567',
    notificationsEnabled: true,
    role: 'customer', // Varsayılan customer
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  // Test business kullanıcısı (user role)
  // Şifre: Business123! (validation kurallarına uygun: 8+ karakter, büyük harf, küçük harf, rakam, özel karakter)
  userStore.set('business@example.com', {
    id: 2,
    email: 'business@example.com',
    password: 'Business123!', // Validation'a uygun şifre
    name: 'Test Business',
    fullName: 'Test Business',
    phone: '5557654321',
    countryCode: 'TR',
    phoneNumber: '5557654321',
    notificationsEnabled: true,
    role: 'user', // Business role
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  // Kahve Dünyası - Çankaya business kullanıcısı (user role)
  // Şifre: KahveDunya123! (validation kurallarına uygun)
  userStore.set('kahvedunyasi.cankaya@example.com', {
    id: 3,
    email: 'kahvedunyasi.cankaya@example.com',
    password: 'KahveDunya123!', // Validation'a uygun şifre
    name: 'Kahve Dünyası',
    fullName: 'Kahve Dünyası - Çankaya',
    phone: '5559876543',
    countryCode: 'TR',
    phoneNumber: '5559876543',
    notificationsEnabled: true,
    role: 'user', // Business role
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  // Business account bilgilerini console'a yazdır (test için)
  console.log('========================================');
  console.log('📋 MOCK BUSINESS ACCOUNT BİLGİLERİ');
  console.log('========================================');
  console.log('Email: business@example.com');
  console.log('Şifre: Business123!');
  console.log('Role: user (business)');
  console.log('Telefon: 5557654321');
  console.log('========================================');
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
        // Eski kullanıcılarda role yoksa 'customer' ekle
        if (!user.role) {
          user.role = 'customer';
        }
        userStore.set(user.email.toLowerCase().trim(), user);
      });
    }
    
    // Test kullanıcılarını her zaman ekle (yoksa)
    // Bu sayede business account her zaman mevcut olur
    const testCustomerEmail = 'test@example.com';
    const testBusinessEmail = 'business@example.com';
    const kahveDunyasiEmail = 'kahvedunyasi.cankaya@example.com';
    
    if (!userStore.has(testCustomerEmail)) {
      userStore.set(testCustomerEmail, {
        id: 1,
        email: testCustomerEmail,
        password: 'password123',
        name: 'Test User',
        fullName: 'Test User',
        phone: '5551234567',
        countryCode: 'TR',
        phoneNumber: '5551234567',
        notificationsEnabled: true,
        role: 'customer',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    if (!userStore.has(testBusinessEmail)) {
      userStore.set(testBusinessEmail, {
        id: 2,
        email: testBusinessEmail,
        password: 'Business123!',
        name: 'Test Business',
        fullName: 'Test Business',
        phone: '5557654321',
        countryCode: 'TR',
        phoneNumber: '5557654321',
        notificationsEnabled: true,
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    if (!userStore.has(kahveDunyasiEmail)) {
      userStore.set(kahveDunyasiEmail, {
        id: 3,
        email: kahveDunyasiEmail,
        password: 'KahveDunya123!',
        name: 'Kahve Dünyası',
        fullName: 'Kahve Dünyası - Çankaya',
        phone: '5559876543',
        countryCode: 'TR',
        phoneNumber: '5559876543',
        notificationsEnabled: true,
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // Test kullanıcıları eklendiyse storage'a kaydet
    if (!stored) {
      await saveStoreToStorage();
    } else {
      // Mevcut storage'da test kullanıcıları yoksa güncelle
      const hasTestUsers = userStore.has(testCustomerEmail) && userStore.has(testBusinessEmail);
      if (hasTestUsers) {
        await saveStoreToStorage();
      }
    }
    
    // Business account bilgilerini console'a yazdır (test için)
    console.log('========================================');
    console.log('📋 MOCK BUSINESS ACCOUNT BİLGİLERİ');
    console.log('========================================');
    console.log('1. Email: business@example.com');
    console.log('   Şifre: Business123!');
    console.log('   Role: user (business)');
    console.log('   Telefon: 5557654321');
    console.log('');
    console.log('2. Email: kahvedunyasi.cankaya@example.com');
    console.log('   Şifre: KahveDunya123!');
    console.log('   Role: user (business)');
    console.log('   İşletme: Kahve Dünyası - Çankaya');
    console.log('   Telefon: 5559876543');
    console.log('========================================');
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

