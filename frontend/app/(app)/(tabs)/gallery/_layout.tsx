import { Stack } from "expo-router";
import { Theme } from "@/constants/theme";

export default function GalleryLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.dark.background,
        },
        headerTitleStyle: {
          color: Theme.container.titleText, // Theme.dark.primary,
        },
        headerTintColor: Theme.container.titleText, // Theme.dark.primary,
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
