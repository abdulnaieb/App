module.exports = {
  name: "Mobile_Application",
  version: "1.0.0",
  expo: {
    name: "Mobile_Application",
    slug: "mobile-application",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.mobile_application"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.anonymous.mobile_application",
      permissions: [
        "CAMERA",
        "NOTIFICATIONS",
        "MEDIA_LIBRARY",
        "INTERNET"
      ]
    },
    plugins: [
      "expo-camera",
      "expo-image-picker",
      "expo-notifications",
      "expo-linear-gradient",
      "expo-screen-orientation",
      "expo-system-ui",
      "expo-updates"
    ],
    extra: {
      eas: {
        projectId: "your-project-id"
      }
    }
  }
}