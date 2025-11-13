import { Stack } from "expo-router";
import { Theme } from '@/constants/theme';

export default function BarsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.dark.background // "#0b0b12"
        },
      }}
    >
      {/* Main directory/search page — hide its header */}
      <Stack.Screen
        name="index"                     // rename to "index" if your search page is index.tsx
        options={{ headerShown: false }}
      />

      {/* Individual bar page */}
      <Stack.Screen name="[id]" options={{ headerShown: true }} />

      {/* Menu page, gallery page, etc. */}
      <Stack.Screen name="[id]/menu" options={{ headerShown: true }} />
    </Stack>
  );
}
