// app/(tabs)/bars/_layout.tsx
import { Stack } from "expo-router";
import { Theme } from "@/constants/theme";

export default function BarsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',         // No slide animation — prevents flash of bar screens
        gestureEnabled: false,     // Disable native swipe-back — our context owns back nav
        headerStyle: {
          backgroundColor: Theme.dark.background,
        },
        headerTintColor: Theme.dark.secondary,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="menu" />
    </Stack>
  );
}
