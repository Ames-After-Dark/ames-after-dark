// app/(app)/(tabs)/account/delete-account.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';

export default function DeleteAccountScreen() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');

  const handleDelete = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email to confirm deletion.');
      return;
    }

    console.log('Deleting account:', email);
    console.log('Reason:', reason);

    Alert.alert('Account Deleted', 'Your account has been successfully deleted.', [
      { text: 'OK', onPress: () => router.replace('/(app)/(tabs)/account') },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Confirm Account Deletion</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Reason (optional)"
        placeholderTextColor="#999"
        value={reason}
        onChangeText={setReason}
        multiline
      />
      <Button title="Delete Account" color="#FF453A" onPress={handleDelete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#0b0b12' },
  title: { color: 'white', fontSize: 22, marginBottom: 16 },
  input: { backgroundColor: '#1f2937', color: 'white', borderRadius: 8, padding: 12, marginBottom: 16 },
});
