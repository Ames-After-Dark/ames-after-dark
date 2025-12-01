import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { router, Stack } from 'expo-router';

export default function DeleteAccountScreen() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');

  const handleDelete = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email to confirm deletion.');
      return;
    }

    Alert.alert('Account Deleted', 'Your account has been successfully deleted.', [
      { text: 'OK', onPress: () => router.replace('/(app)/(tabs)/account') },
    ]);
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

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={[styles.input, styles.reasonInput]}
        placeholder="Reason (optional)"
        placeholderTextColor="#666"
        value={reason}
        onChangeText={setReason}
        multiline
      />

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
