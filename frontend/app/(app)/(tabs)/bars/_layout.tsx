import { Stack } from "expo-router";

export default function BarsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0b0b12" },
        headerTintColor: "#33CCFF",      // neon blue arrow color
        headerTitle: "",                 // no text next to the arrow
        headerShadowVisible: false,      // optional: remove line under header
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
