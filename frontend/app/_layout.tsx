import { Slot } from 'expo-router'
import { Auth0Provider } from "react-native-auth0"
import { AuthProvider } from "@/hooks/use-auth"
import { config } from '@/auth0.config'
import { UserProvider } from '../context/user-context';

export default function RootLayout() {
  return (
    <Auth0Provider domain={config.domain} clientId={config.clientId}>
      <AuthProvider>
        <UserProvider>
          <Slot />
        </UserProvider>
      </AuthProvider>
    </Auth0Provider>
  );
}
