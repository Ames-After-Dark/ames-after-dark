import { useAuth } from "@/hooks/use-auth"
import { DefaultTheme, DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import { Stack, useSegments, useRouter } from 'expo-router'
import { useEffect } from 'react'

export default function AppLayout() {
  const { isAuthenticated, isLoading, setIsSwitching, userStatus } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const colorScheme = useColorScheme()

  useEffect(() => {
    if (isLoading) {
      return
    }

    const inAuthGroup = segments[1] === "(auth)"
    const inTabsGroup = segments[1] === "(tabs)"
    const currentPath = segments.join("/")

    // Guests are allowed into the public tabs for App Store compliant browsing.
    if (!isAuthenticated) {
      if (!inTabsGroup && !inAuthGroup) {
        router.replace("/(app)/(tabs)" as any)
      }
      return
    }

    // If authenticated, check registration status
    if (isAuthenticated) {
      // Wait for userStatus to load
      if (userStatus === null) {
        return
      }

      // If requires registration and not on register screen, go to register
      if (userStatus.requiresRegistration && !currentPath.includes("register")) {
        console.log("Redirecting to registration")
        router.navigate("/(app)/(auth)/register")
        setIsSwitching(false)
      }
      // If profile complete and not on tabs, go to tabs
      else if (userStatus.profileComplete && !inTabsGroup) {
        console.log("Switching to (tabs) screen")
        router.replace("/(app)/(tabs)" as any)
        setIsSwitching(false)
      }
    }
  }, [isAuthenticated, isLoading, segments, userStatus])

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a'
      }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ gestureEnabled: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  )
}
