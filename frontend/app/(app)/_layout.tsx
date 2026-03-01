import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { NavigationContainer, DefaultTheme, DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import { Stack, useSegments, useRouter, Redirect } from 'expo-router'
import { useEffect, useState } from 'react'

export default function AppLayout() {
  const { isAuthenticated, isLoading, isSwitching, setIsSwitching, userStatus} = useAuth()
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

    // If not authenticated, redirect to auth
    if (!isAuthenticated && !inAuthGroup) {
      console.log("Switching to (auth) screen")
      router.navigate("/(app)/(auth)")
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
        router.navigate("/(app)/(tabs)" as any)
        setIsSwitching(false)
      }
    }
  }, [isAuthenticated, isLoading, segments, userStatus])

  if (isLoading){
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
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false}}/>
        </Stack>
      </ThemeProvider>
  )
}