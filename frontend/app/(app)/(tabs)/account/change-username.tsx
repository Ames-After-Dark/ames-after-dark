import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import React, { useState } from "react";

export default function ChangeUsernameScreen() {
  const [username, setUsername] = useState("");

  const handleSubmit = () => {
    console.log("New username:", username);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Change Username',
          headerBackTitle: 'Settings',
          headerStyle: {
            backgroundColor: '#0b0b12',
          },
          headerTintColor: 'white',
        }}
      />
      <Text style={styles.label}>New Username</Text>
      <Stack.Screen
        options={{
          title: "Change Username",
          headerBackTitle: "Settings",
          headerStyle: { backgroundColor: "#0b0b12" },
          headerTintColor: "white",
        }}
      />

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Current username:{" "}
          <Text style={styles.currentUsername}>
            {originalUsername}
          </Text>
        </Text>
      </View>

      <Text style={styles.label}>New Username</Text>

      <TextInput
        style={styles.input}
        value={username}
        placeholder="Enter new username"
        placeholderTextColor="#999"
        onChangeText={setUsername}
      />
      <Button title="Save" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", padding: 16 },
  label: { color: "white", marginBottom: 8 },
  input: {
        backgroundColor: "#1f2937",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        color: "white",
  },
});
