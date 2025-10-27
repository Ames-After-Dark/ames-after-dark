import {Button, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth0, Auth0Provider} from 'react-native-auth0';
import { useAuth } from "@/hooks/use-auth"

export default function AccountScreen() {
  const { user, signOut, isLoading } = useAuth()
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  return (
    <View style={{ flex: 1 }}>
        <View style={styles.logoutButtonContainer}>
          <Button title="Log Out" onPress={signOut} />
        </View>
        <ParallaxScrollView
          headerBackgroundColor={{ light: '#2A2A2A', dark: '#2A2A2A' }}
          headerImage={<IconSymbol size={220} name="person.crop.circle" color="#808080" />}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Account</ThemedText>
            <ThemedView style={styles.container}>
                <ThemedText>Edit Account Details Below</ThemedText>
            </ThemedView>
              <TextInput
                placeholder="Name"
                style={styles.input}
                autoCapitalize="none"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#888"
              />

              <TextInput
                placeholder="Email"
                style={styles.input}
                secureTextEntry
                value={email}
                onChangeText={setEmail}
                placeholderTextColor="#888"
              />
        </ParallaxScrollView>`
    </View>
  );
}


const styles = StyleSheet.create({
    logoutButtonContainer: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
        width: 100,
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
