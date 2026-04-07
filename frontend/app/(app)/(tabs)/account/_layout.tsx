// app/(tabs)/account/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function AccountStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',         // No slide animation — prevents flash of account screens
        gestureEnabled: false,     // Disable native swipe-back — our context owns back nav
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
