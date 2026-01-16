/**
 * Activity Mock Service
 * Mock activity servisleri - standart response contract kullanır
 */

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
 * Son 10 activity/order'ı getir (bildirimler için)
 * Activity table'dan son 10 order'ı çeker
 * @returns {Promise<{success: boolean, data: Array, error: any}>}
 */
export const getRecentActivities = async () => {
  await delay(500);

  // Mock activity verileri - Activity table'dan son 10 order
  const mockActivities = [
    {
      id: 10,
      type: 'paymentMade',
      restaurantName: 'Kahve Dünyası - Çankaya',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 saat önce
      orderId: 'ORD-0010',
    },
    {
      id: 9,
      type: 'orderPlaced',
      cafeName: 'Starbucks - Kızılay',
      date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 saat önce
      orderId: 'ORD-0009',
    },
    {
      id: 8,
      type: 'cafeVisited',
      cafeName: 'Gloria Jeans - Bahçelievler',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 gün önce
      orderId: 'ORD-0008',
    },
    {
      id: 7,
      type: 'paymentMade',
      restaurantName: 'Kahve Dünyası - Çankaya',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 gün önce
      orderId: 'ORD-0007',
    },
    {
      id: 6,
      type: 'orderPlaced',
      cafeName: 'Starbucks - Kızılay',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 gün önce
      orderId: 'ORD-0006',
    },
    {
      id: 5,
      type: 'cafeVisited',
      cafeName: 'Gloria Jeans - Bahçelievler',
      date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 gün önce
      orderId: 'ORD-0005',
    },
    {
      id: 4,
      type: 'paymentMade',
      restaurantName: 'Kahve Dünyası - Çankaya',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 gün önce
      orderId: 'ORD-0004',
    },
    {
      id: 3,
      type: 'orderPlaced',
      cafeName: 'Starbucks - Kızılay',
      date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 gün önce
      orderId: 'ORD-0003',
    },
    {
      id: 2,
      type: 'cafeVisited',
      cafeName: 'Gloria Jeans - Bahçelievler',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 gün önce
      orderId: 'ORD-0002',
    },
    {
      id: 1,
      type: 'paymentMade',
      restaurantName: 'Kahve Dünyası - Çankaya',
      date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 gün önce
      orderId: 'ORD-0001',
    },
  ];

  return createResponse(true, mockActivities, null);
};
