import 'dotenv/config';
const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: "Ames After Dark",
    slug: "Ames-After-Dark",
    version: "1.1.0",
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
      supportsTablet: false,
      bundleIdentifier: IS_DEV ? "com.amesafterdark.app.dev" : "com.amesafterdark.app",
      buildNumber: "23", //increment this from last successful upload
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        "UIBackgroundModes": ["location", "fetch"],
        "NSLocationWhenInUseUsageDescription": "Ames After Dark uses your location to show you nearby bars, events, and drink specials on the map.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Ames After Dark requires background location access to actively share your live location on the interactive map with your approved friends while you are out. This is limited to mutual friends and can be configured in privacy settings."
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
      "expo-secure-store",

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
      "expo-web-browser",
      ["expo-media-library", {
        photosPermission: "Ames After Dark accesses your photo library so you can save bar photos to your device.",
        savePhotosPermission: "Ames After Dark saves bar photos to your photo library when you download them from the gallery."
      }]
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },

    extra: {
      router: {},
      eas: {
        projectId: "3087f40f-3c08-44de-8f1d-b4feaa8bfb6d"
      }
    }
  }
};
