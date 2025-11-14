import 'dotenv/config';

export default {
  expo: {
    name: "Ames-After-Dark",
    slug: "Ames-After-Dark",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "com.anonymous.amesafterdark",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: { supportsTablet: true },

    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.amesafterdark"
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },

    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: { backgroundColor: "#000000" }
        }
      ],
      "expo-web-browser"
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },

    extra: {
      router: {},
      SMUGMUG_API_KEY: process.env.SMUGMUG_API_KEY,
      eas: {
        projectId: "3087f40f-3c08-44de-8f1d-b4feaa8bfb6d"
      }
    }
  }
};
