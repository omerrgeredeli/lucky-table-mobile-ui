/**
 * Mesafe hesaplama yardımcı fonksiyonları
 * Haversine formülü kullanılarak iki koordinat arasındaki mesafe hesaplanır
 */

/**
 * Haversine formülü ile iki koordinat arasındaki mesafeyi hesaplar (km)
 * @param {number} lat1 - İlk noktanın enlemi
 * @param {number} lon1 - İlk noktanın boylamı
 * @param {number} lat2 - İkinci noktanın enlemi
 * @param {number} lon2 - İkinci noktanın boylamı
 * @returns {number} Mesafe (kilometre cinsinden)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Dereceyi radyana çevirir
 * @param {number} degrees - Derece
 * @returns {number} Radyan
 */
const toRad = (degrees) => {
  return (degrees * Math.PI) / 180;
};

/**
 * Kafeleri mesafeye göre sıralar
 * @param {Array} cafes - Kafe listesi
 * @param {number} userLat - Kullanıcı enlemi
 * @param {number} userLon - Kullanıcı boylamı
 * @returns {Array} Mesafeye göre sıralanmış kafe listesi
 */
export const sortCafesByDistance = (cafes, userLat, userLon) => {
  return cafes
    .map((cafe) => {
      if (!cafe.latitude || !cafe.longitude) {
        return { ...cafe, distance: Infinity };
      }
      const distance = calculateDistance(
        userLat,
        userLon,
        cafe.latitude,
        cafe.longitude
      );
      return { ...cafe, distance };
    })
    .sort((a, b) => a.distance - b.distance);
};

