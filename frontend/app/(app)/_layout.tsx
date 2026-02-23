// TEMP_AUTH_START - Remove when re-enabling Auth0
import { NavigationContainer, DefaultTheme, DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useColorScheme, View, ActivityIndicator } from "react-native";
import { Stack, segments, useSegments, useRouter, Redirect } from 'expo-router'
import { useEffect, useState } from 'react'

export default function AppLayout() {
  const segments = useSegments()
  const router = useRouter()
  const colorScheme = useColorScheme()
  
  const isIndex = segments.length === 1 && segments[0] === "(app)"

  // Redirect to auth landing instead of tabs
  if (isIndex) {
    return <Redirect href="/(app)/(auth)" />
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  )
}
// TEMP_AUTH_END

// Original Auth0 version - uncomment when re-enabling Auth0
// import { AuthProvider, useAuth } from "@/hooks/use-auth"
// import { NavigationContainer, DefaultTheme, DarkTheme, ThemeProvider } from "@react-navigation/native";
// import { useColorScheme, View, ActivityIndicator } from "react-native";
// import { Stack, segments, useSegments, useRouter, Redirect } from 'expo-router'
// import { useEffect, useState } from 'react'

// export default function AppLayout() {
//   const { isAuthenticated, isLoading, isSwitching, setIsSwitching} = useAuth()
//   const segments = useSegments()
//   const router = useRouter()
//   const colorScheme = useColorScheme()

//   useEffect(() => {
//     if (isLoading) {
//       return
//     }

//     const inAuthGroup = segments[1] === "(auth)"
//     const inTabsGroup = segments[1] === "(tabs)"

//     if (isAuthenticated && !inTabsGroup) {
//       router.navigate("/(app)/(tabs)")
//       console.log("Switching to (tabs) screen")
//       setIsSwitching(false)
//     } else if (!isAuthenticated && !inAuthGroup) {
//       console.log("Switching to (auth) screen")
//       router.navigate("/(app)/(auth)")
//     }
//   }, [isAuthenticated, isLoading, segments])

//   if (isLoading){
//     return (
//       <View style={{
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         backgroundColor: '#0a0a0a'
//       }}>
//         <ActivityIndicator size="large" color="#2563eb" />
//       </View>
//     )
//   }

//   return (
//       <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
//         <Stack>
//           <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
//           <Stack.Screen name="(auth)" options={{ headerShown: false }} />
//           <Stack.Screen name="index" options={{ headerShown: false}}/>
//         </Stack>
//       </ThemeProvider>
//   )
// }





