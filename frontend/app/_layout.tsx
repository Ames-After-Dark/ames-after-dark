import { Slot, usePathname } from 'expo-router'
import { useEffect } from 'react'
import { Auth0Provider } from "react-native-auth0"
import { AuthProvider } from "@/hooks/use-auth"
import { config } from '@/auth0.config'
import { UserProvider } from '@/context/user-context';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { NavigationHistoryProvider, useNavigationHistory } from '@/context/NavigationHistoryContext';
import '@/services/backgroundLocationTask'; // Import the background task definition

// Sits inside the provider so it can call useNavigationHistory
function NavigationRecorder() {
  const pathname = usePathname();
  const { recordVisit } = useNavigationHistory();

  useEffect(() => {
    recordVisit(pathname);
  }, [pathname]);

  return null;
}

export default function RootLayout() {
  return (
    <Auth0Provider domain={config.domain!} clientId={config.clientId!}>
      <AuthProvider>
        <UserProvider>
          <FavoritesProvider>
            <NavigationHistoryProvider>
              <NavigationRecorder />
              <Slot />
            </NavigationHistoryProvider>
          </FavoritesProvider>
        </UserProvider>
      </AuthProvider>
    </Auth0Provider>
  );
}
