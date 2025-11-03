import { Stack } from "expo-router";

export default function BarsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#0b0b12" },
      }}
    >
      {/* Bars directory */}
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />

      {/* Individual bar info page */}
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
