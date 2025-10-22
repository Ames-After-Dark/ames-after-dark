import { StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth0, Auth0Provider} from 'react-native-auth0';
import { Button, View, Text } from 'react-native';

export default function AccountScreen() {

  const {authorize, clearSession, user, getCredentials, error, isLoading} = useAuth0();

  const onLogout = async () => {
    await clearSession({}, {});
  };

  return (
    <View>
        <View style={styles.logoutButtonContainer}>
            <Button title="Log Out" onPress={onLogout} />
        </View>
        <ParallaxScrollView
          headerBackgroundColor={{ light: '#2A2A2A', dark: '#2A2A2A' }}
          headerImage={<IconSymbol size={220} name="person.crop.circle" color="#808080" />}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Account</ThemedText>
          </ThemedView>
          <ThemedView style={styles.container}>
            <ThemedText>Account details will go here.</ThemedText>
          </ThemedView>
        </ParallaxScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
    logoutButtonContainer: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    container: {
        padding: 8,
    },
});
