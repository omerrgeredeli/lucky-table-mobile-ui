// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Web için resolver ayarları
config.resolver = config.resolver || {};

// Web stub dosyası
const webStubPath = require.resolve('./src/utils/webStubs.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Web için native modülleri ve React Native internal modüllerini handle et
  if (platform === 'web') {
    // Native-only modülleri stub'a yönlendir - TAM EŞLEŞME + ALT MODÜLLER
    const nativeModules = [
      'expo-camera',
      'react-native-qrcode-svg',
      'react-native-camera',
      'expo-secure-store',
      'react-native-gesture-handler',
    ];
    
    // Tam modül adı eşleşmesi
    if (nativeModules.includes(moduleName)) {
      return {
        filePath: webStubPath,
        type: 'sourceFile',
      };
    }
    
    // Alt modüller (örn: expo-camera/CameraView, expo-camera/build/CameraView)
    for (const mod of nativeModules) {
      if (moduleName.startsWith(mod + '/') || moduleName.startsWith(mod + '\\')) {
        return {
          filePath: webStubPath,
          type: 'sourceFile',
        };
      }
    }
    
    // Node modules içinden gelen native modül istekleri
    if (moduleName.includes('node_modules') && nativeModules.some(mod => moduleName.includes(mod))) {
      return {
        filePath: webStubPath,
        type: 'sourceFile',
      };
    }
    
    // Relative path'ler - TÜM varyasyonlar
    if (moduleName.includes('Utilities/Platform')) {
      return {
        filePath: require.resolve('react-native-web/dist/exports/Platform'),
        type: 'sourceFile',
      };
    }
    
    // Diğer React Native internal relative path'ler
    const relativeInternalPatterns = [
      /Components\/AccessibilityInfo\/legacySendAccessibilityEvent/,
      /Image\/Image$/,
      /Utilities\/BackHandler$/,
      /DevToolsSettings\/DevToolsSettingsManager$/,
      /NativeComponent\/BaseViewConfig$/,
      /StyleSheet\/PlatformColorValueTypes$/,
      /Alert\/RCTAlertManager$/,
      /Network\/RCTNetworking$/,
    ];
    
    for (const pattern of relativeInternalPatterns) {
      if (pattern.test(moduleName)) {
        return {
          filePath: webStubPath,
          type: 'sourceFile',
        };
      }
    }
    
    // Absolute path'ler
    if (moduleName.startsWith('react-native/Libraries/')) {
      if (moduleName.includes('Utilities/Platform')) {
        return {
          filePath: require.resolve('react-native-web/dist/exports/Platform'),
          type: 'sourceFile',
        };
      }
      // Diğer tüm React Native internal modüller için stub
      return {
        filePath: webStubPath,
        type: 'sourceFile',
      };
    }
  }
  
  // Varsayılan resolver'ı kullan
  return context.resolveRequest(context, moduleName, platform);
};

// Web için platform extensions
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Source extensions
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), 'web.js', 'web.jsx'];

module.exports = config;

