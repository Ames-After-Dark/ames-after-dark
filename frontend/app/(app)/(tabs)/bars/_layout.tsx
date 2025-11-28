import { Stack } from "expo-router";
import { Theme } from '@/constants/theme';

export default function BarsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Theme.dark.background
        },
      }}
    >
      {/* Main directory/search page — hide its header */}
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="[id]"
        options={{
//             headerShown: false
            headerStyle: {
                backgroundColor: Theme.dark.background,
            },
            headerTintColor: Theme.container.activeText,
            headerBackTitle: 'Bars',
            title: '',
        }}
      />


    </Stack>
  );
}

//       {/* Individual bar page */}
//          <Stack.Screen name="[id]" options={{ headerShown: true }} />

//       {/* Menu page, gallery page, etc. */}
//       <Stack.Screen name="[id]/menu" options={{ headerShown: true }} />