import { Auth0Provider } from "react-native-auth0"
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { NavigationContainer, DefaultTheme, DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useColorScheme, View, ActivityIndicator, colorScheme } from "react-native";
import {Stack, segments, useSegments, useRouter} from 'expo-router'
import { config } from '@/auth0.config'
import {useEffect, useState} from 'react'

export default function AppLayout() {
  const { isAuthenticated, isLoading, isSwitching, setIsSwitching} = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) {
      return
    }

    const inAuthGroup = segments[1] === "(auth)"
    const inTabsGroup = segments[1] === "(tabs)"

    if (isAuthenticated && !inTabsGroup) {
      router.navigate("/(app)/(tabs)")
      console.log("Switching to (tabs) screen")
      setIsSwitching(false)
    } else if (!isAuthenticated && !inAuthGroup) {
      console.log("Switching to (auth) screen")
      router.navigate("/(app)/(auth)")
    }
  }, [isAuthenticated, isLoading, segments])

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





