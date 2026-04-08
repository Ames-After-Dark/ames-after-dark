// app/(tabs)/gallery/_layout.tsx
import { Stack } from "expo-router";
import { Theme } from "@/constants/theme";

export default function GalleryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',         // No slide animation — prevents flash of gallery screens
        gestureEnabled: false,     // Disable native swipe-back — our context owns back nav
        headerStyle: {
          backgroundColor: Theme.dark.background,
        },
        headerTitleStyle: {
          color: Theme.container.titleText,
        },
        headerTintColor: Theme.container.titleText,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[barId]" />
    </Stack>
  );
}
