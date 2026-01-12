/**
 * Promotion Mock Service
 * Promosyon kullanımı için mock servis
 */

import { mockPromotionsData } from '../../utils/mockData';

/**
 * Promosyonu kullan (isUsed = true yap)
 * @param {number} promotionId - Promosyon ID
 * @param {number} userId - Kullanıcı ID
 * @param {string} userToken - Business user token
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const usePromotion = async (promotionId, userId, userToken) => {
  // Simüle edilmiş gecikme
  await new Promise((resolve) => setTimeout(resolve, 500));
  
  // Promosyonu bul
  const promotion = mockPromotionsData.find(
    (p) => p.promotionId === promotionId && p.userId === userId
  );
  
  if (!promotion) {
    return {
      success: false,
      error: 'Promosyon bulunamadı',
    };
  }
  
  // Süresi dolmuş mu?
  const expireDate = new Date(promotion.promotionExpireDate);
  const now = new Date();
  if (expireDate < now) {
    return {
      success: false,
      error: 'Süresi dolmuş promosyon',
    };
  }
  
  // Zaten kullanılmış mı?
  if (promotion.isUsed) {
    return {
      success: false,
      error: 'Kullanılmış promosyon',
    };
  }
  
  // Promosyonu kullan (isUsed = true)
  promotion.isUsed = true;
  
  // Not: Gerçek uygulamada bu değişiklik backend'e gönderilir
  // Mock'ta sadece memory'de güncellenir
  
  return {
    success: true,
  };
};

