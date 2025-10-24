import { useColorScheme, View, ActivityIndicator, colorScheme } from "react-native";

export default function Index() {
  return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
}
