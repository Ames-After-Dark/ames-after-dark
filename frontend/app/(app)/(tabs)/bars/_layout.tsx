// app/(tabs)/bars/_layout.tsx
import { Stack } from "expo-router";
import { Theme } from "@/constants/theme";

export default function BarsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.dark.background,
        },
        headerTintColor: Theme.dark.secondary,
      }}
    >
      {/* Main directory/search page — hide its header */}
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      {/* Bar detail screen */}
      <Stack.Screen
        name="[id]"
        options={{
          title: "",
          headerBackTitle: "Bars",
        }}
      />

      {/* Bar menu screen: / (tabs) /bars/menu */}
      <Stack.Screen
        name="menu"
        options={{
          title: "Menu",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
