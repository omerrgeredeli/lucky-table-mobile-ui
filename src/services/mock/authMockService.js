/**
 * Auth Mock Service
 * Mock authentication servisleri - standart response contract kullanır
 * In-memory user store ile gerçekçi test ortamı sağlar
 */

import {
  getUserByEmail,
  addUser,
  hasUser,
  updateUser,
  getAllUsers,
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
 * Kullanıcı giriş işlemi (Mock)
 * @param {string} emailOrPhone - Kullanıcı email'i veya telefon numarası
 * @param {string} password - Kullanıcı şifresi
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const login = async (emailOrPhone, password) => {
  await delay(300 + Math.random() * 400); // 300-700ms

  let user = null;
  let normalizedEmail = null;

  // Email veya telefon kontrolü
  if (emailOrPhone.includes('@')) {
    // Email ile login
    normalizedEmail = emailOrPhone.toLowerCase().trim();
    user = getUserByEmail(normalizedEmail);
    
    // Debug: Business account kontrolü
    if (normalizedEmail === 'business@example.com') {
      console.log('🔍 Business account login attempt:', {
        email: normalizedEmail,
        userFound: !!user,
        userRole: user?.role,
      });
    }
  } else {
    // Telefon numarası ile login
    const cleanedPhone = emailOrPhone.replace(/\s/g, '').replace(/[()-]/g, '');
    // Store'dan telefon numarasına göre kullanıcı bul
    for (const storeUser of getAllUsers()) {
      const userPhone = storeUser.phone?.replace(/\s/g, '').replace(/[()-]/g, '');
      if (userPhone === cleanedPhone) {
        user = storeUser;
        normalizedEmail = storeUser.email;
        break;
      }
    }
  }

  // Hata senaryosu: geçersiz email veya telefon
  if (!emailOrPhone || (!emailOrPhone.includes('@') && !/^(\+90|0)?[5][0-9]{9}$/.test(emailOrPhone.replace(/\s/g, '').replace(/[()-]/g, '')))) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_INPUT',
        message: 'Geçerli bir email adresi veya telefon numarası giriniz',
      }
    );
  }

  // Hata senaryosu: kullanıcı bulunamadı
  if (!user) {
    // Debug: Tüm kullanıcıları listele
    const allUsers = getAllUsers();
    console.warn('⚠️ User not found. Available users:', allUsers.map(u => u.email));
    
    return createResponse(
      false,
      null,
      {
        code: 'USER_NOT_FOUND',
        message: 'Bu email adresi ile kayıtlı kullanıcı bulunamadı',
      }
    );
  }

  // Hata senaryosu: şifre yanlış
  if (user.password !== password) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_PASSWORD',
        message: 'Email veya şifre hatalı',
      }
    );
  }

  // Başarılı giriş - token'a email ve role bilgisini ekle
  const userRole = user.role || 'customer'; // Varsayılan customer
  const token = `mock_jwt_token_${Date.now()}_${user.id}_${normalizedEmail.replace('@', '_at_')}_${userRole}`;
  
  // Token'ı AsyncStorage'a kaydet (email bilgisi ile)
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userEmail', normalizedEmail); // Email'i ayrı kaydet
  } catch (error) {
    console.warn('Token kaydetme hatası:', error);
  }
  
  return createResponse(
    true,
    {
      token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: userRole,
      },
    },
    null
  );
};

/**
 * Kullanıcı kayıt işlemi (Mock)
 * @param {string} email - Kullanıcı email'i
 * @param {string} password - Kullanıcı şifresi
 * @param {Object} phoneData - Telefon bilgileri { fullName, countryCode, phoneNumber }
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const signup = async (email, password, phoneData = {}) => {
  await delay(400 + Math.random() * 300); // 400-700ms

  // Hata senaryosu: geçersiz email
  if (!email || !email.includes('@')) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_EMAIL',
        message: 'Geçerli bir email adresi giriniz',
      }
    );
  }

  // Hata senaryosu: zayıf şifre
  if (!password || password.length < 8) {
    return createResponse(
      false,
      null,
      {
        code: 'WEAK_PASSWORD',
        message: 'Şifre en az 8 karakter olmalıdır',
      }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Hata senaryosu: email zaten kullanılıyor
  if (hasUser(normalizedEmail)) {
    return createResponse(
      false,
      null,
      {
        code: 'EMAIL_EXISTS',
        message: 'Bu email adresi zaten kullanılıyor',
      }
    );
  }

  // Telefon bilgilerini al
  const { fullName = '', countryCode = 'TR', phoneNumber = '' } = phoneData;
  const cleanedPhone = phoneNumber ? phoneNumber.replace(/\s/g, '').replace(/[()-]/g, '') : '';

  // Yeni kullanıcı oluştur (signup her zaman customer role ile)
  const newUser = {
    id: Date.now(), // Unique ID
    email: normalizedEmail,
    password: password, // Gerçek uygulamada hash'lenmeli
    name: fullName || email.split('@')[0], // fullName varsa kullan, yoksa email'den türet
    fullName: fullName || email.split('@')[0], // fullName alanı
    phone: cleanedPhone, // Backward compatibility için
    countryCode: countryCode || 'TR',
    phoneNumber: cleanedPhone,
    notificationsEnabled: true, // Varsayılan
    role: 'customer', // Signup her zaman customer role ile
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Store'a ekle
  await addUser(newUser);

  // Başarılı kayıt - token'a email ve role bilgisini ekle
  const token = `mock_jwt_token_${Date.now()}_${newUser.id}_${normalizedEmail.replace('@', '_at_')}_customer`;
  
  // Token'ı AsyncStorage'a kaydet (email bilgisi ile)
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userEmail', normalizedEmail); // Email'i ayrı kaydet
  } catch (error) {
    console.warn('Token kaydetme hatası:', error);
  }
  
  return createResponse(
    true,
    {
      token: token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        fullName: newUser.fullName,
        role: 'customer',
      },
    },
    null
  );
};

/**
 * Şifre sıfırlama isteği (Mock)
 * @param {string} email - Kullanıcı email'i
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const forgotPassword = async (email) => {
  await delay(500 + Math.random() * 200); // 500-700ms

  // Hata senaryosu: geçersiz email
  if (!email || !email.includes('@')) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_EMAIL',
        message: 'Geçerli bir email adresi giriniz',
      }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Hata senaryosu: email bulunamadı
  if (!hasUser(normalizedEmail)) {
    return createResponse(
      false,
      null,
      {
        code: 'EMAIL_NOT_FOUND',
        message: 'Bu email adresi ile kayıtlı kullanıcı bulunamadı',
      }
    );
  }

  // Başarılı
  return createResponse(
    true,
    {
      message: 'Şifre sıfırlama linki email adresinize gönderildi',
    },
    null
  );
};

/**
 * Aktivasyon kodu gönderme (Mock)
 * Profil güncelleme için yeni email/telefon'a aktivasyon kodu gönderilir
 * Login için mevcut email/telefon'a aktivasyon kodu gönderilir
 * @param {string} emailOrPhone - Email veya telefon (yeni veya mevcut)
 * @returns {Promise<{success: boolean, data: any, error: any}>}
 */
export const sendActivationCode = async (emailOrPhone) => {
  await delay(400 + Math.random() * 300); // 400-700ms

  // Email kontrolü
  const isEmail = emailOrPhone?.includes('@');
  const normalizedEmail = isEmail ? emailOrPhone.toLowerCase().trim() : null;

  // Telefon kontrolü
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  const cleanedPhone = emailOrPhone?.replace(/\s/g, '').replace(/[()-]/g, '');
  const isPhone = phoneRegex.test(cleanedPhone);

  // Hata senaryosu: geçerli email veya telefon formatı kontrolü
  if (!isEmail && !isPhone) {
    return createResponse(
      false,
      null,
      {
        code: 'INVALID_INPUT',
        message: 'Geçerli bir email adresi veya telefon numarası giriniz',
      }
    );
  }

  // Profil güncelleme için aktivasyon kodu gönderiliyor - yeni email/telefon için kontrol yapmaya gerek yok
  // Login için aktivasyon kodu gönderiliyor - mevcut kullanıcı kontrolü yapılabilir ama zorunlu değil
  // Mock'ta her zaman başarılı döndürüyoruz (yeni email/telefon için de çalışır)

  // Başarılı - aktivasyon kodu gönderildi (mock)
  return createResponse(
    true,
    {
      message: `Aktivasyon kodu ${isEmail ? normalizedEmail : cleanedPhone} adresine gönderildi`,
      code: '123456', // Mock aktivasyon kodu (gerçek uygulamada backend'den gelir)
    },
    null
  );
};

