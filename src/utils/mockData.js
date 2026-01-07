/**
 * Mock Data - Development ve test için
 * Backend yoksa bu mock data kullanılır
 */

// Sipariş türleri listesi
const orderTypes = ['Kahve', 'Çay', 'Pasta', 'Sandviç', 'Salata', 'Pizza', 'Burger', 'Döner', 'Simit', 'Dondurma', 'Et', 'Tavuk', 'Patates', 'Market', 'Çeşitli'];

// Sipariş geçmişi oluşturma fonksiyonu
const generateOrderHistory = (cafeId, orderCount, foodTypes, lastOrderDate) => {
  const history = [];
  const baseDate = new Date(lastOrderDate);
  
  for (let i = 0; i < orderCount; i++) {
    const orderDate = new Date(baseDate);
    orderDate.setDate(orderDate.getDate() - (orderCount - i - 1) * 3); // Her 3 günde bir sipariş
    
    // Sipariş türünü foodTypes'dan rastgele seç veya genel bir tür kullan
    const orderType = foodTypes && foodTypes.length > 0 
      ? foodTypes[Math.floor(Math.random() * foodTypes.length)]
      : orderTypes[Math.floor(Math.random() * orderTypes.length)];
    
    history.push({
      date: orderDate.toISOString().split('T')[0], // YYYY-MM-DD formatı
      orderType: orderType,
    });
  }
  
  // Tarihe göre sırala (en yeni önce)
  return history.sort((a, b) => new Date(b.date) - new Date(a.date));
};

// Mock loyalty data - 20 adet
export const mockLoyaltyData = [
  {
    cafeId: 1,
    cafeName: 'Starbucks',
    orderCount: 7,
    freeProductAt: 10,
    points: 70,
    city: 'İstanbul',
    district: 'Kadıköy',
    neighborhood: 'Moda',
    foodTypes: ['Kahve', 'Pasta'],
    hasCampaign: true,
    lastOrderDate: '2024-01-15',
    orderHistory: generateOrderHistory(1, 7, ['Kahve', 'Pasta'], '2024-01-15'),
  },
  {
    cafeId: 2,
    cafeName: 'Kahve Dünyası',
    orderCount: 15,
    freeProductAt: 10,
    points: 150,
    city: 'İstanbul',
    district: 'Beşiktaş',
    neighborhood: 'Bebek',
    foodTypes: ['Kahve', 'Çay'],
    hasCampaign: false,
    lastOrderDate: '2024-01-20',
    orderHistory: generateOrderHistory(2, 15, ['Kahve', 'Çay'], '2024-01-20'),
  },
  {
    cafeId: 3,
    cafeName: 'Gloria Jeans',
    orderCount: 3,
    freeProductAt: 10,
    points: 30,
    city: 'İstanbul',
    district: 'Şişli',
    neighborhood: 'Nişantaşı',
    foodTypes: ['Kahve', 'Sandviç'],
    hasCampaign: true,
    lastOrderDate: '2024-01-10',
    orderHistory: generateOrderHistory(3, 3, ['Kahve', 'Sandviç'], '2024-01-10'),
  },
  {
    cafeId: 4,
    cafeName: 'Coffeeshop Company',
    orderCount: 12,
    freeProductAt: 10,
    points: 120,
    city: 'İstanbul',
    district: 'Beyoğlu',
    neighborhood: 'Taksim',
    foodTypes: ['Kahve', 'Pasta', 'Salata'],
    hasCampaign: true,
    lastOrderDate: '2024-01-18',
    orderHistory: generateOrderHistory(4, 12, ['Kahve', 'Pasta', 'Salata'], '2024-01-18'),
  },
  {
    cafeId: 5,
    cafeName: 'Mado',
    orderCount: 5,
    freeProductAt: 10,
    points: 50,
    city: 'İstanbul',
    district: 'Üsküdar',
    neighborhood: 'Ortaköy',
    foodTypes: ['Dondurma', 'Pasta'],
    hasCampaign: false,
    lastOrderDate: '2024-01-12',
    orderHistory: generateOrderHistory(5, 5, ['Dondurma', 'Pasta'], '2024-01-12'),
  },
  {
    cafeId: 6,
    cafeName: 'Caffe Nero',
    orderCount: 9,
    freeProductAt: 10,
    points: 90,
    city: 'Ankara',
    district: 'Çankaya',
    neighborhood: 'Kızılay',
    foodTypes: ['Kahve', 'Sandviç'],
    hasCampaign: true,
    lastOrderDate: '2024-01-16',
    orderHistory: generateOrderHistory(6, 9, ['Kahve', 'Sandviç'], '2024-01-16'),
  },
  {
    cafeId: 7,
    cafeName: 'Kahve Diyarı',
    orderCount: 18,
    freeProductAt: 10,
    points: 180,
    city: 'İstanbul',
    district: 'Kadıköy',
    neighborhood: 'Moda',
    foodTypes: ['Kahve', 'Çay', 'Pasta'],
    hasCampaign: true,
    lastOrderDate: '2024-01-22',
    orderHistory: generateOrderHistory(7, 18, ['Kahve', 'Çay', 'Pasta'], '2024-01-22'),
  },
  {
    cafeId: 8,
    cafeName: 'Burger King',
    orderCount: 4,
    freeProductAt: 10,
    points: 40,
    city: 'İstanbul',
    district: 'Beşiktaş',
    neighborhood: 'Bebek',
    foodTypes: ['Burger', 'Patates'],
    hasCampaign: false,
    lastOrderDate: '2024-01-08',
    orderHistory: generateOrderHistory(8, 4, ['Burger', 'Patates'], '2024-01-08'),
  },
  {
    cafeId: 9,
    cafeName: 'Pizza Hut',
    orderCount: 11,
    freeProductAt: 10,
    points: 110,
    city: 'İzmir',
    district: 'Konak',
    neighborhood: 'Alsancak',
    foodTypes: ['Pizza', 'Salata'],
    hasCampaign: true,
    lastOrderDate: '2024-01-19',
    orderHistory: generateOrderHistory(9, 11, ['Pizza', 'Salata'], '2024-01-19'),
  },
  {
    cafeId: 10,
    cafeName: 'Domino\'s Pizza',
    orderCount: 6,
    freeProductAt: 10,
    points: 60,
    city: 'İstanbul',
    district: 'Şişli',
    neighborhood: 'Nişantaşı',
    foodTypes: ['Pizza'],
    hasCampaign: true,
    lastOrderDate: '2024-01-14',
    orderHistory: generateOrderHistory(10, 6, ['Pizza'], '2024-01-14'),
  },
  {
    cafeId: 11,
    cafeName: 'Simit Sarayı',
    orderCount: 20,
    freeProductAt: 10,
    points: 200,
    city: 'İstanbul',
    district: 'Beyoğlu',
    neighborhood: 'Taksim',
    foodTypes: ['Simit', 'Çay', 'Peynir'],
    hasCampaign: false,
    lastOrderDate: '2024-01-23',
    orderHistory: generateOrderHistory(11, 20, ['Simit', 'Çay', 'Peynir'], '2024-01-23'),
  },
  {
    cafeId: 12,
    cafeName: 'Baydoner',
    orderCount: 8,
    freeProductAt: 10,
    points: 80,
    city: 'Ankara',
    district: 'Çankaya',
    neighborhood: 'Kızılay',
    foodTypes: ['Döner', 'Lahmacun'],
    hasCampaign: true,
    lastOrderDate: '2024-01-17',
    orderHistory: generateOrderHistory(12, 8, ['Döner', 'Lahmacun'], '2024-01-17'),
  },
  {
    cafeId: 13,
    cafeName: 'KFC',
    orderCount: 13,
    freeProductAt: 10,
    points: 130,
    city: 'İstanbul',
    district: 'Üsküdar',
    neighborhood: 'Ortaköy',
    foodTypes: ['Tavuk', 'Patates'],
    hasCampaign: true,
    lastOrderDate: '2024-01-21',
    orderHistory: generateOrderHistory(13, 13, ['Tavuk', 'Patates'], '2024-01-21'),
  },
  {
    cafeId: 14,
    cafeName: 'McDonald\'s',
    orderCount: 16,
    freeProductAt: 10,
    points: 160,
    city: 'İzmir',
    district: 'Konak',
    neighborhood: 'Alsancak',
    foodTypes: ['Burger', 'Patates'],
    hasCampaign: false,
    lastOrderDate: '2024-01-24',
    orderHistory: generateOrderHistory(14, 16, ['Burger', 'Patates'], '2024-01-24'),
  },
  {
    cafeId: 15,
    cafeName: 'Popeyes',
    orderCount: 2,
    freeProductAt: 10,
    points: 20,
    city: 'İstanbul',
    district: 'Kadıköy',
    neighborhood: 'Moda',
    foodTypes: ['Tavuk', 'Patates'],
    hasCampaign: true,
    lastOrderDate: '2024-01-05',
    orderHistory: generateOrderHistory(15, 2, ['Tavuk', 'Patates'], '2024-01-05'),
  },
  {
    cafeId: 16,
    cafeName: 'Nusret',
    orderCount: 19,
    freeProductAt: 10,
    points: 190,
    city: 'İstanbul',
    district: 'Beşiktaş',
    neighborhood: 'Bebek',
    foodTypes: ['Et', 'Salata'],
    hasCampaign: false,
    lastOrderDate: '2024-01-25',
    orderHistory: generateOrderHistory(16, 19, ['Et', 'Salata'], '2024-01-25'),
  },
  {
    cafeId: 17,
    cafeName: 'Zomato',
    orderCount: 10,
    freeProductAt: 10,
    points: 100,
    city: 'Ankara',
    district: 'Çankaya',
    neighborhood: 'Kızılay',
    foodTypes: ['Çeşitli'],
    hasCampaign: true,
    lastOrderDate: '2024-01-13',
    orderHistory: generateOrderHistory(17, 10, ['Çeşitli'], '2024-01-13'),
  },
  {
    cafeId: 18,
    cafeName: 'Yemeksepeti',
    orderCount: 14,
    freeProductAt: 10,
    points: 140,
    city: 'İzmir',
    district: 'Konak',
    neighborhood: 'Alsancak',
    foodTypes: ['Çeşitli'],
    hasCampaign: true,
    lastOrderDate: '2024-01-11',
    orderHistory: generateOrderHistory(18, 14, ['Çeşitli'], '2024-01-11'),
  },
  {
    cafeId: 19,
    cafeName: 'Getir',
    orderCount: 17,
    freeProductAt: 10,
    points: 170,
    city: 'İstanbul',
    district: 'Şişli',
    neighborhood: 'Nişantaşı',
    foodTypes: ['Çeşitli'],
    hasCampaign: false,
    lastOrderDate: '2024-01-09',
    orderHistory: generateOrderHistory(19, 17, ['Çeşitli'], '2024-01-09'),
  },
  {
    cafeId: 20,
    cafeName: 'Migros',
    orderCount: 1,
    freeProductAt: 10,
    points: 10,
    city: 'İstanbul',
    district: 'Beyoğlu',
    neighborhood: 'Taksim',
    foodTypes: ['Market'],
    hasCampaign: true,
    lastOrderDate: '2024-01-03',
    orderHistory: generateOrderHistory(20, 1, ['Market'], '2024-01-03'),
  },
];

// Mock cafe search results - 20 adet
export const mockCafeSearch = (query) => {
  // mockNearbyCafes ile aynı veriyi kullan
  const allCafes = mockNearbyCafes(41.0082, 28.9784);

  if (!query || !query.trim()) return allCafes;

  const lowerQuery = query.toLowerCase();
  return allCafes.filter(
    (cafe) =>
      (cafe.name || '').toLowerCase().includes(lowerQuery) ||
      (cafe.address || '').toLowerCase().includes(lowerQuery)
  );
};

// Mock nearby cafes - 20 adet - Ankara haritasına uygun
// Bu kafeler sadece bu uygulamaya aitmiş gibi görünsün
// Gerçek koordinatlar ile haritada marker olarak gösterilecek
export const mockNearbyCafes = (latitude, longitude) => {
  // Ankara merkez koordinatları: 39.9334, 32.8597
  // Kullanıcı konumuna göre dinamik kafe verileri oluştur
  const baseLat = latitude || 39.9334;
  const baseLng = longitude || 32.8597;
  
  // Mesafe hesaplama fonksiyonu
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  const cafes = [
    {
      id: 1,
      name: 'Starbucks - Kızılay',
      address: 'Kızılay, Çankaya, Ankara',
      latitude: 39.9208,
      longitude: 32.8541,
      restaurantType: 'Kafe',
      hasCampaign: true,
      foodCategories: ['DRINK'], // İçecek
      foodSubCategories: ['kahve', 'çay'],
    },
    {
      id: 2,
      name: 'Kahve Dünyası - Çankaya',
      address: 'Çankaya, Ankara',
      latitude: 39.9180,
      longitude: 32.8560,
      restaurantType: 'Kafe',
      hasCampaign: false,
      foodCategories: ['DRINK'],
      foodSubCategories: ['kahve', 'çay'],
    },
    {
      id: 3,
      name: 'Gloria Jeans - Bahçelievler',
      address: 'Bahçelievler, Çankaya, Ankara',
      latitude: 39.9250,
      longitude: 32.8600,
      restaurantType: 'Kafe',
      hasCampaign: true,
      foodCategories: ['BOTH'],
      foodSubCategories: ['kahve', 'sandviç', 'pasta'],
    },
    {
      id: 4,
      name: 'Coffeeshop Company - Keçiören',
      address: 'Keçiören, Ankara',
      latitude: 39.9700,
      longitude: 32.8700,
      restaurantType: 'Kafe',
      hasCampaign: true,
      foodCategories: ['BOTH'],
      foodSubCategories: ['kahve', 'pasta', 'salata'],
    },
    {
      id: 5,
      name: 'Mado - Yenimahalle',
      address: 'Yenimahalle, Ankara',
      latitude: 39.9500,
      longitude: 32.8000,
      restaurantType: 'Pastane',
      hasCampaign: false,
      foodCategories: ['FOOD'],
      foodSubCategories: ['dondurma', 'pasta', 'tatlı'],
    },
    {
      id: 6,
      name: 'Caffe Nero - Çankaya',
      address: 'Çankaya, Ankara',
      latitude: 39.9150,
      longitude: 32.8500,
      restaurantType: 'Kafe',
      hasCampaign: true,
      foodCategories: ['DRINK'],
      foodSubCategories: ['kahve', 'soğuk-içecek'],
    },
    {
      id: 7,
      name: 'Kahve Diyarı - Kızılay',
      address: 'Kızılay, Çankaya, Ankara',
      latitude: 39.9220,
      longitude: 32.8520,
      restaurantType: 'Kafe',
      hasCampaign: true,
      foodCategories: ['BOTH'],
      foodSubCategories: ['kahve', 'çay', 'pasta'],
    },
    {
      id: 8,
      name: 'Burger King - Çankaya',
      address: 'Çankaya, Ankara',
      latitude: 39.9100,
      longitude: 32.8480,
      restaurantType: 'Restoran',
      hasCampaign: false,
      foodCategories: ['FOOD'],
      foodSubCategories: ['burger', 'patates'],
    },
    {
      id: 9,
      name: 'Pizza Hut - Keçiören',
      address: 'Keçiören, Ankara',
      latitude: 39.9650,
      longitude: 32.8650,
      restaurantType: 'Restoran',
      hasCampaign: true,
      foodCategories: ['FOOD'],
      foodSubCategories: ['pizza', 'salata'],
    },
    {
      id: 10,
      name: 'Domino\'s Pizza - Çankaya',
      address: 'Çankaya, Ankara',
      latitude: 39.9120,
      longitude: 32.8550,
      restaurantType: 'Restoran',
      hasCampaign: true,
      foodCategories: ['FOOD'],
      foodSubCategories: ['pizza'],
    },
    {
      id: 11,
      name: 'Simit Sarayı - Kızılay',
      address: 'Kızılay, Çankaya, Ankara',
      latitude: 39.9190,
      longitude: 32.8530,
      restaurantType: 'Pastane',
      hasCampaign: false,
      foodCategories: ['FOOD'],
      foodSubCategories: ['simit', 'çay'],
    },
    {
      id: 12,
      name: 'Baydoner - Çankaya',
      address: 'Çankaya, Ankara',
      latitude: 39.9160,
      longitude: 32.8510,
      restaurantType: 'Restoran',
      hasCampaign: true,
      foodCategories: ['FOOD'],
      foodSubCategories: ['döner', 'lahmacun'],
    },
    {
      id: 13,
      name: 'KFC - Yenimahalle',
      address: 'Yenimahalle, Ankara',
      latitude: 39.9450,
      longitude: 32.8100,
      restaurantType: 'Restoran',
      hasCampaign: true,
      foodCategories: ['FOOD'],
      foodSubCategories: ['tavuk', 'patates'],
    },
    {
      id: 14,
      name: 'McDonald\'s - Çankaya',
      address: 'Çankaya, Ankara',
      latitude: 39.9080,
      longitude: 32.8490,
      restaurantType: 'Restoran',
      hasCampaign: false,
      foodCategories: ['FOOD'],
      foodSubCategories: ['burger', 'patates'],
    },
    {
      id: 15,
      name: 'Popeyes - Keçiören',
      address: 'Keçiören, Ankara',
      latitude: 39.9680,
      longitude: 32.8620,
      restaurantType: 'Restoran',
      hasCampaign: true,
      foodCategories: ['FOOD'],
      foodSubCategories: ['tavuk', 'patates'],
    },
    {
      id: 16,
      name: 'Nusret - Çankaya',
      address: 'Çankaya, Ankara',
      latitude: 39.9140,
      longitude: 32.8570,
      restaurantType: 'Restoran',
      hasCampaign: false,
      foodCategories: ['FOOD'],
      foodSubCategories: ['et', 'salata'],
    },
    {
      id: 17,
      name: 'Zomato - Kızılay',
      address: 'Kızılay, Çankaya, Ankara',
      latitude: 39.9210,
      longitude: 32.8550,
      restaurantType: 'Restoran',
      hasCampaign: true,
      foodCategories: ['BOTH'],
      foodSubCategories: ['pizza', 'burger', 'kahve'],
    },
    {
      id: 18,
      name: 'Yemeksepeti - Çankaya',
      address: 'Çankaya, Ankara',
      latitude: 39.9130,
      longitude: 32.8520,
      restaurantType: 'Restoran',
      hasCampaign: true,
      foodCategories: ['BOTH'],
      foodSubCategories: ['pizza', 'burger', 'döner'],
    },
    {
      id: 19,
      name: 'Getir - Yenimahalle',
      address: 'Yenimahalle, Ankara',
      latitude: 39.9480,
      longitude: 32.8050,
      restaurantType: 'Restoran',
      hasCampaign: false,
      foodCategories: ['BOTH'],
      foodSubCategories: ['pizza', 'burger', 'kahve'],
    },
    {
      id: 20,
      name: 'Migros - Çankaya',
      address: 'Çankaya, Ankara',
      latitude: 39.9110,
      longitude: 32.8500,
      restaurantType: 'Restoran',
      hasCampaign: true,
      foodCategories: ['BOTH'],
      foodSubCategories: ['sandviç', 'salata', 'soğuk-içecek'],
    },
  ];
  
  // Mesafe hesapla ve ekle
  return cafes.map(cafe => {
    const distance = calculateDistance(baseLat, baseLng, cafe.latitude, cafe.longitude);
    return {
      ...cafe,
      distance: parseFloat(distance.toFixed(2)),
    };
  });
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

