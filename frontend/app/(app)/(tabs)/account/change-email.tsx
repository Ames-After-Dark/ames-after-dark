import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import React, { useState } from "react";

export default function ChangeEmailScreen() {
  const [email, setEmail] = useState("");

  return (
    <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Change Email',
                    headerBackTitle: 'Settings',
                    headerStyle: {
                        backgroundColor: '#0b0b12',
                    },
                    headerTintColor: 'white',
                }}
            />
      <Text style={styles.label}>New Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        placeholder="Enter new email"
        placeholderTextColor="#999"
        keyboardType="email-address"
        onChangeText={setEmail}
      />
      <Button title="Save" onPress={() => console.log("Email updated")} />
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
    color: "white",
    marginVertical: 16,
  },
});
