// Web stubs for React Native internal modules that are not available on web
// These modules are replaced with empty stubs during webpack compilation

/**
 * Web Stubs
 * Native modüller için web'de boş stub'lar
 * Metro bundler web'de bu modülleri yüklemeye çalıştığında bu stub kullanılır
 */

// expo-camera stub
module.exports = {
  CameraView: null,
  useCameraPermissions: () => [
    { granted: false, canAskAgain: false },
    async () => ({ granted: false, canAskAgain: false }),
  ],
  CameraType: { back: 'back', front: 'front' },
};

// react-native-qrcode-svg stub
if (typeof module !== 'undefined' && module.exports) {
  module.exports.default = null;
}
