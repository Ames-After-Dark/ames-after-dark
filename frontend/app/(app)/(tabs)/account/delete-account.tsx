import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { deleteAccount } from '@/services/userService';

export default function DeleteAccountScreen() {
  const { signOut, getAccessToken } = useAuth()
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      Alert.alert('Error', 'Could not get access token.');
      return;
    }

    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and sign you out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            try {
              // 1. Clear Auth0 session first. If user cancels the Auth0 popup, this should reject.
              await signOut(true);

              // 2. With the previously fetched accessToken, delete the account on the backend.
              await deleteAccount(accessToken);

              // 3. Navigate away; signOut already cleared local state.
              router.replace('/');
            } catch (err) {
              console.error('Failed to sign out or delete account:', err);
              Alert.alert('Error', 'Could not complete account deletion. Please try again.');
            }
          },
        },
      ]
    );
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

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={isSubmitting}>
        <Text style={styles.deleteButtonText}>{isSubmitting ? 'Deleting…' : 'Delete Account'}</Text>
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
