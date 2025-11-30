import { Stack } from "expo-router";
import { Theme } from '@/constants/theme';

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
          title: "",              // no "[id]" in the center
          headerBackTitle: "Bars" // back label
        }}
      />

      {/* Bar menu screen: /bars/[id]/menu */}
      <Stack.Screen
        name="[id]/menu"
        options={{
          title: "Menu",          // center title
          headerBackTitle: "Back" // back label (from bar page)
        }}
      />
    </Stack>
  );
}
