import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import React, { useState } from "react";

export default function ChangePasswordScreen() {
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Change Password',
                    headerBackTitle: 'Settings',
                    headerStyle: {
                        backgroundColor: '#0b0b12',
                    },
                    headerTintColor: 'white',
                }}
            />      <Text style={styles.label}>New Password</Text>
      <TextInput
        secureTextEntry
        style={styles.input}
        value={password}
        placeholder="Enter new password"
        placeholderTextColor="#999"
        onChangeText={setPassword}
      />
      <Button title="Update Password" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", padding: 16 },
  label: { color: "white" },
  input: {
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
    color: "white",
  },
});
