/**
 * Location Data - Şehir, İlçe, Semt hiyerarşisi
 * Backend'den gelecek yapıya uyumlu
 */

// Mock veri: 5-6 şehir
export const locationData = [
  {
    id: 1,
    name: 'İstanbul',
    districts: [
      {
        id: 101,
        name: 'Kadıköy',
        neighborhoods: [
          { id: 10101, name: 'Moda' },
          { id: 10102, name: 'Fenerbahçe' },
          { id: 10103, name: 'Bostancı' },
          { id: 10104, name: 'Acıbadem' },
        ],
      },
      {
        id: 102,
        name: 'Beşiktaş',
        neighborhoods: [
          { id: 10201, name: 'Bebek' },
          { id: 10202, name: 'Ortaköy' },
          { id: 10203, name: 'Etiler' },
          { id: 10204, name: 'Levent' },
        ],
      },
      {
        id: 103,
        name: 'Şişli',
        neighborhoods: [
          { id: 10301, name: 'Nişantaşı' },
          { id: 10302, name: 'Mecidiyeköy' },
          { id: 10303, name: 'Levent' },
          { id: 10304, name: 'Gayrettepe' },
        ],
      },
      {
        id: 104,
        name: 'Beyoğlu',
        neighborhoods: [
          { id: 10401, name: 'Taksim' },
          { id: 10402, name: 'Galata' },
          { id: 10403, name: 'Karaköy' },
          { id: 10404, name: 'Cihangir' },
        ],
      },
      {
        id: 105,
        name: 'Üsküdar',
        neighborhoods: [
          { id: 10501, name: 'Ortaköy' },
          { id: 10502, name: 'Çengelköy' },
          { id: 10503, name: 'Kuzguncuk' },
          { id: 10504, name: 'Beylerbeyi' },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Ankara',
    districts: [
      {
        id: 201,
        name: 'Çankaya',
        neighborhoods: [
          { id: 20101, name: 'Kızılay' },
          { id: 20102, name: 'Bahçelievler' },
          { id: 20103, name: 'Çankaya' },
          { id: 20104, name: 'Kavaklıdere' },
        ],
      },
      {
        id: 202,
        name: 'Keçiören',
        neighborhoods: [
          { id: 20201, name: 'Etlik' },
          { id: 20202, name: 'Akpınar' },
          { id: 20203, name: 'Kalaba' },
          { id: 20204, name: 'Aktepe' },
        ],
      },
      {
        id: 203,
        name: 'Yenimahalle',
        neighborhoods: [
          { id: 20301, name: 'Demetevler' },
          { id: 20302, name: 'Batıkent' },
          { id: 20303, name: 'Yenimahalle' },
          { id: 20304, name: 'Karşıyaka' },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'İzmir',
    districts: [
      {
        id: 301,
        name: 'Konak',
        neighborhoods: [
          { id: 30101, name: 'Alsancak' },
          { id: 30102, name: 'Konak' },
          { id: 30103, name: 'Basmane' },
          { id: 30104, name: 'Karataş' },
        ],
      },
      {
        id: 302,
        name: 'Bornova',
        neighborhoods: [
          { id: 30201, name: 'Bornova' },
          { id: 30202, name: 'Bostanlı' },
          { id: 30203, name: 'Çiğli' },
          { id: 30204, name: 'Evka-3' },
        ],
      },
      {
        id: 303,
        name: 'Karşıyaka',
        neighborhoods: [
          { id: 30301, name: 'Karşıyaka' },
          { id: 30302, name: 'Bostanlı' },
          { id: 30303, name: 'Alaybey' },
          { id: 30304, name: 'Narlıdere' },
        ],
      },
    ],
  },
  {
    id: 4,
    name: 'Bursa',
    districts: [
      {
        id: 401,
        name: 'Osmangazi',
        neighborhoods: [
          { id: 40101, name: 'Merkez' },
          { id: 40102, name: 'Çekirge' },
          { id: 40103, name: 'Kültürpark' },
        ],
      },
      {
        id: 402,
        name: 'Nilüfer',
        neighborhoods: [
          { id: 40201, name: 'Nilüfer' },
          { id: 40202, name: 'Görükle' },
        ],
      },
    ],
  },
  {
    id: 5,
    name: 'Antalya',
    districts: [
      {
        id: 501,
        name: 'Muratpaşa',
        neighborhoods: [
          { id: 50101, name: 'Konyaaltı' },
          { id: 50102, name: 'Lara' },
        ],
      },
      {
        id: 502,
        name: 'Kepez',
        neighborhoods: [
          { id: 50201, name: 'Kepez' },
          { id: 50202, name: 'Döşemealtı' },
        ],
      },
    ],
  },
  {
    id: 6,
    name: 'Adana',
    districts: [
      {
        id: 601,
        name: 'Seyhan',
        neighborhoods: [
          { id: 60101, name: 'Merkez' },
          { id: 60102, name: 'Kurtuluş' },
        ],
      },
    ],
  },
];

// Helper functions
export const getCityById = (cityId) => {
  return locationData.find((city) => city.id === cityId);
};

export const getDistrictById = (cityId, districtId) => {
  const city = getCityById(cityId);
  return city?.districts.find((district) => district.id === districtId);
};

export const getNeighborhoodById = (cityId, districtId, neighborhoodId) => {
  const district = getDistrictById(cityId, districtId);
  return district?.neighborhoods.find((neighborhood) => neighborhood.id === neighborhoodId);
};

