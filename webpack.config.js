const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ['react-i18next'],
      },
    },
    argv
  );

  // React Native web için resolve alias'ları ekle
  config.resolve = config.resolve || {};
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    // React Native internal modüllerini react-native-web'e yönlendir
    'react-native/Libraries/Utilities/Platform': 'react-native-web/dist/exports/Platform',
    'react-native/Libraries/Image/Image': 'react-native-web/dist/exports/Image',
    'react-native/Libraries/Components/View/View': 'react-native-web/dist/exports/View',
    'react-native/Libraries/Components/Text/Text': 'react-native-web/dist/exports/Text',
  };
  
  // Resolve extensions'a .web.js ekle (web-specific modüller için)
  if (!config.resolve.extensions) {
    config.resolve.extensions = ['.web.js', '.js', '.json', '.web.jsx', '.jsx'];
  } else {
    config.resolve.extensions = ['.web.js', ...config.resolve.extensions];
  }

  // Web için node modülleri ignore et
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    net: false,
    tls: false,
    crypto: false,
    stream: false,
    path: false,
    os: false,
  };

  // React Native internal native modüllerini stub'larla replace et (web'de kullanılmıyor)
  config.plugins = config.plugins || [];
  
  // React Native internal native modüllerini boş stub'larla replace et
  const stubPath = require.resolve('./src/utils/webStubs.js');
  
  // NormalModuleReplacementPlugin ile relative path'leri handle et
  // Bu modüller React Native'in internal modülleri ve web'de kullanılmıyor
  const createReplacement = (pattern) => {
    return new webpack.NormalModuleReplacementPlugin(pattern, stubPath);
  };
  
  // Relative path patterns - farklı derinliklerdeki relative path'leri handle et
  // Pattern'ler dosya path'inin sonunda match edecek şekilde ayarlandı
  const relativePatterns = [
    /RCTAlertManager$/,
    /RCTNetworking$/,
    /Utilities\/Platform$/,
    /Utilities\/BackHandler$/,
    /Image\/Image$/,
    /DevToolsSettings\/DevToolsSettingsManager$/,
    /NativeComponent\/BaseViewConfig$/,
    /StyleSheet\/PlatformColorValueTypes$/,
    /Components\/AccessibilityInfo\/legacySendAccessibilityEvent$/,
  ];
  
  relativePatterns.forEach((pattern) => {
    config.plugins.push(createReplacement(pattern));
  });
  
  // Absolute path'ler için IgnorePlugin kullan
  config.plugins.push(
    new webpack.IgnorePlugin({
      resourceRegExp: /^(react-native\/Libraries\/Alert\/RCTAlertManager|react-native\/Libraries\/Network\/RCTNetworking|react-native\/Libraries\/Utilities\/BackHandler|react-native\/Libraries\/DevToolsSettings\/DevToolsSettingsManager|react-native\/Libraries\/NativeComponent\/BaseViewConfig|react-native\/Libraries\/StyleSheet\/PlatformColorValueTypes|react-native\/Libraries\/Components\/AccessibilityInfo\/legacySendAccessibilityEvent)$/,
    })
  );
  
  // Webpack 5'te ignoreWarnings kullan
  if (!config.ignoreWarnings) {
    config.ignoreWarnings = [];
  }
  
  // React Native internal modül hatalarını ignore et
  const ignorePatterns = [
    /Module not found.*react-native\/Libraries/,
    /Module not found.*RCT/,
    /Module not found.*NativeModules/,
    /Module not found.*Utilities\/Platform/,
    /Module not found.*Image\/Image/,
    /Module not found.*DevToolsSettingsManager/,
    /Module not found.*BaseViewConfig/,
    /Module not found.*PlatformColorValueTypes/,
    /Module not found.*legacySendAccessibilityEvent/,
    /Module not found.*BackHandler/,
    /Module not found.*RCTNetworking/,
    /Module not found.*RCTAlertManager/,
  ];
  
  ignorePatterns.forEach((pattern) => {
    config.ignoreWarnings.push(pattern);
  });

  // Webpack stats ayarları - React Native internal modül hatalarını gizle
  if (!config.stats) {
    config.stats = {};
  }
  
  // React Native internal modül hatalarını filtrele
  const warningFilters = [
    /Module not found.*react-native\/Libraries/,
    /Module not found.*RCT/,
    /Module not found.*NativeModules/,
    /Module not found.*Utilities\/Platform/,
    /Module not found.*Image\/Image/,
    /Module not found.*DevToolsSettingsManager/,
    /Module not found.*BaseViewConfig/,
    /Module not found.*PlatformColorValueTypes/,
    /Module not found.*legacySendAccessibilityEvent/,
    /Module not found.*BackHandler/,
    /Module not found.*RCTNetworking/,
    /Module not found.*RCTAlertManager/,
  ];
  
  // warningsFilter array olarak başlat
  if (Array.isArray(config.stats.warningsFilter)) {
    config.stats.warningsFilter.push(...warningFilters);
  } else {
    config.stats.warningsFilter = warningFilters;
  }

  return config;
};
