import 'dotenv/config';
const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: "Ames-After-Dark",
    slug: "Ames-After-Dark",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/aad_icon.png",
    scheme: "com.amesafterdark.app",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    //EAS OTA Configuration settings
    owner: "amesafterdark",
    updates: {
      url: "https://u.expo.dev/3087f40f-3c08-44de-8f1d-b4feaa8bfb6d"
    },
    runtimeVersion: {
      policy: "appVersion"
    },

    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV ? "com.amesafterdark.app.dev" : "com.amesafterdark.app",
      buildNumber: "4", //increment this from last successful upload
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        "UIBackgroundModes": ["location", "fetch"],
        "NSLocationAlwaysAndWhenInUseUsageDescription": "We need your location in the background to keep your friends updated while you are out at the bars!"
      },
    },

    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.amesafterdark.app"
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },

    plugins: [
      "expo-router",

      ["react-native-auth0", {
        domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN
      }],
      ["expo-splash-screen", {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" }
      }],
      "expo-web-browser"
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },

    extra: {
      router: {},
      BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3000',
      SMUGMUG_API_KEY: process.env.SMUGMUG_API_KEY,
      eas: {
        projectId: "3087f40f-3c08-44de-8f1d-b4feaa8bfb6d"
      }
    }
  }
};
