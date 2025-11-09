// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// This is the configuration for web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    // If we're on web and importing 'react-native-maps',
    // use '@teovilla/react-native-web-maps' instead
    return context.resolveRequest(
      context,
      '@teovilla/react-native-web-maps',
      platform
    );
  }

  // For everything else, use the default behavior
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;