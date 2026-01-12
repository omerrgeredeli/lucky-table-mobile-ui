/**
 * Tema Shadow (Gölge) Tanımları
 * iOS, Android ve Web uyumlu gölge stilleri
 */

import { Platform } from 'react-native';

// Web için boxShadow oluştur
const createBoxShadow = (offsetY, blur, opacity) => {
  if (Platform.OS === 'web') {
    return {
      boxShadow: `0 ${offsetY}px ${blur}px rgba(0, 0, 0, ${opacity})`,
    };
  }
  return {};
};

export const shadows = {
  // Küçük gölge - Hafif elevation
  small: {
    ...createBoxShadow(1, 2, 0.1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // Android için
  },

  // Orta gölge - Standart card gölgesi
  medium: {
    ...createBoxShadow(2, 4, 0.1),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android için
  },

  // Büyük gölge - Öne çıkan elementler için
  large: {
    ...createBoxShadow(4, 8, 0.15),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5, // Android için
  },

  // Çok büyük gölge - Modal, popup gibi elementler için
  xlarge: {
    ...createBoxShadow(8, 16, 0.2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8, // Android için
  },
};

