import { Stack } from "expo-router";
import { Theme } from "@/constants/theme";

export default function GalleryLayout() {
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
      {/* Bar list screen */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false, // hide header for the list
        }}
      />

      {/* Bar photos screen */}
      <Stack.Screen
        name="[barId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
