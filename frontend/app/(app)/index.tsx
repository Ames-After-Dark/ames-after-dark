import { Redirect } from "expo-router"
import { useColorScheme, View, ActivityIndicator, colorScheme } from "react-native";
import { AuthProvider, useAuth } from "@/hooks/use-auth"

export default function Index() {
  return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
}
