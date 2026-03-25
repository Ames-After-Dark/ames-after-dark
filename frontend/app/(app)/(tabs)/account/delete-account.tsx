import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { deleteAccount } from '@/services/userService';

export default function DeleteAccountScreen() {
  const { signOut, getAccessToken } = useAuth()
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');

  const handleDelete = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      Alert.alert('Error', 'Could not get access token.');
      return;
    }

    try {
      await deleteAccount(accessToken);
      // Sign out via Auth0 and navigate away
      await signOut();
      router.replace('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen
        options={{
          title: 'Delete Account',
          headerBackTitle: 'Settings',
          headerStyle: {
            backgroundColor: '#0b0b12',
          },
          headerTintColor: 'white',
        }}
      />

      <Text style={styles.title}>Confirm Account Deletion</Text>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b12",
  },
  content: {
    padding: 16,
  },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#1a1a22",
    color: "white",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  reasonInput: {
    height: 100,
  },
  deleteButton: {
    backgroundColor: "#FF453A",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
