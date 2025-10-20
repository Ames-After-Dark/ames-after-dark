import { ThemeProvider } from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import { Stack} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthenticationCheck } from '@/hooks/use-auth';
import { NavigationThemeLight, NavigationThemeDark } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const authenticated = useAuthenticationCheck();
  return (
    <ThemeProvider value={NavigationThemeDark as Theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name={authenticated ? "(tabs)" : "(auth)/login"}
        />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
