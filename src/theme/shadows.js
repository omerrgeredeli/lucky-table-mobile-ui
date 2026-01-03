/**
 * Tema Shadow (Gölge) Tanımları
 * iOS ve Android uyumlu gölge stilleri
 */

export const shadows = {
  // Küçük gölge - Hafif elevation
  small: {
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

