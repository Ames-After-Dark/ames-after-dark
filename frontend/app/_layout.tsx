import { Stack, Slot} from 'expo-router';
import {Auth0Provider} from 'react-native-auth0';
import {View} from 'react-native';

export default function RootLayoutNav(){
    return (
        <Auth0Provider domain="dev-lz0c3j2voxj6hy6v.us.auth0.com" clientId="fQkKYY3zDeKaQZYEQdPt2IrCRgvA5eKN">
            <Stack screenOptions={{ headerShown: false }}>
                 <Stack.Screen name="(auth)" />
                 <Stack.Screen name="(tabs)" />
             </Stack>
        </Auth0Provider>
    );
};

