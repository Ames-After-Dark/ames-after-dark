import React from 'react';
import { StyleSheet, View, Button, Text } from 'react-native';

// UI components (keep these imports the same if they exist in your project)
import ParallaxScrollView from '../../components/parallax-scroll-view';
import { ThemedText } from '../../components/themed-text';
import { ThemedView } from '../../components/themed-view';
import { IconSymbol } from '../../components/icon-symbol';

// --- Auth temporarily disabled ---
// import { useAuth0, Auth0Provider} from 'react-native-auth0';
// import { useAuth } from "@/hooks/use-auth"

export default function FriendsScreen() {
  // --- Disabled Auth Logic ---
  // const { user, signOut, isLoading } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      {/* --- Placeholder Log Out button (disabled for now) --- */}
      <View style={styles.logoutButtonContainer}>
        <Button  title="Log Out" onPress={() => {}}   disabled={true}
          
        />
        {/* Original:
            <Button title="Log Out" onPress={signOut} />
        */}
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
    top: 40,
    right: 20,
    zIndex: 10,
    width: 120,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  container: {
    padding: 16,
    gap: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
});
