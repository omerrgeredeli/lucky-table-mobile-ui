/**
 * Mock Data - Development ve test için
 * Backend yoksa bu mock data kullanılır
 */

// Mock loyalty data
export const mockLoyaltyData = [
  {
    cafeId: 1,
    cafeName: 'Starbucks',
    orderCount: 7,
    freeProductAt: 10,
    points: 70,
  },
  {
    cafeId: 2,
    cafeName: 'Kahve Dünyası',
    orderCount: 15,
    freeProductAt: 10,
    points: 150,
  },
  {
    cafeId: 3,
    cafeName: 'Gloria Jeans',
    orderCount: 3,
    freeProductAt: 10,
    points: 30,
  },
];

// Mock cafe search results
export const mockCafeSearch = (query) => {
  const allCafes = [
    {
      id: 1,
      name: 'Starbucks',
      address: 'Kadıköy, İstanbul',
      latitude: 40.9882,
      longitude: 29.0244,
      distance: 0.5,
    },
    {
      id: 2,
      name: 'Kahve Dünyası',
      address: 'Beşiktaş, İstanbul',
      latitude: 41.0422,
      longitude: 29.0084,
      distance: 1.2,
    },
    {
      id: 3,
      name: 'Gloria Jeans',
      address: 'Şişli, İstanbul',
      latitude: 41.0602,
      longitude: 28.9874,
      distance: 2.5,
    },
    {
      id: 4,
      name: 'Coffeeshop Company',
      address: 'Beyoğlu, İstanbul',
      latitude: 41.0369,
      longitude: 28.9850,
      distance: 3.1,
    },
  ];

  if (!query) return allCafes;

  const lowerQuery = query.toLowerCase();
  return allCafes.filter(
    (cafe) =>
      cafe.name.toLowerCase().includes(lowerQuery) ||
      cafe.address.toLowerCase().includes(lowerQuery)
  );
};

// Mock nearby cafes
export const mockNearbyCafes = (latitude, longitude) => {
  return [
    {
      id: 1,
      name: 'Starbucks',
      address: 'Kadıköy, İstanbul',
      latitude: 40.9882,
      longitude: 29.0244,
      distance: 0.5,
    },
    {
      id: 2,
      name: 'Kahve Dünyası',
      address: 'Beşiktaş, İstanbul',
      latitude: 41.0422,
      longitude: 29.0084,
      distance: 1.2,
    },
    {
      id: 3,
      name: 'Gloria Jeans',
      address: 'Şişli, İstanbul',
      latitude: 41.0602,
      longitude: 28.9874,
      distance: 2.5,
    },
  ];
};

// Mock login response
export const mockLoginResponse = (email, password) => {
  // Basit mock - gerçek uygulamada backend'den gelir
  return {
    token: 'mock_jwt_token_' + Date.now(),
    user: {
      id: 1,
      email: email,
      name: 'Test User',
    },
  };
};

// Mock signup response
export const mockSignupResponse = (email, password) => {
  return {
    token: 'mock_jwt_token_' + Date.now(),
    user: {
      id: 2,
      email: email,
      name: 'New User',
    },
  };
};

