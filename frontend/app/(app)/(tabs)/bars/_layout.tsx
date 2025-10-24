import { Stack } from "expo-router";
import { Theme } from "@/constants/theme";

export default function BarsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.dark.surface,
        },
        headerTitleStyle: {
          color: Theme.dark.primary,
        },
        headerTintColor: Theme.dark.primary,
      }}
    >
      {/* Bars directory */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      {/* Bar info */}
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
