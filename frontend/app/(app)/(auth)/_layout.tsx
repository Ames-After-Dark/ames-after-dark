import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import { useColorScheme, View, ActivityIndicator, colorScheme } from "react-native";
import { useEffect } from 'react'

export default function AuthLayout() {
    const { isLoading} = useAuth()

    if (isLoading) {
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#0a0a0a'
        }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
    );
}
