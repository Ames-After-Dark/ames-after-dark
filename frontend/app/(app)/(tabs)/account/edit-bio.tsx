import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import React, { useState, useEffect } from "react";

export default function ChangeBioScreen() {
  const MAX_CHARS = 150;

  // Pretend this is coming from your backend or auth store
  const mockCurrentBio = "I love late-night adventures and meeting new people!";

  const [bio, setBio] = useState("");

  useEffect(() => {
    // Load existing bio when the screen mounts
    setBio(mockCurrentBio);
  }, []);

  const handleSubmit = () => {
    console.log("Updated Bio:", bio);
    // TODO: send this to backend
  };

  return (
    <View style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'Edit Bio',
                    headerBackTitle: 'Settings',
                    headerStyle: {
                        backgroundColor: '#0b0b12',
                    },
                    headerTintColor: 'white',
                }}
            />
      <Text style={styles.label}>Your Bio</Text>

      <TextInput
        style={styles.textarea}
        value={bio}
        multiline
        maxLength={MAX_CHARS}
        placeholder="Write something about yourself..."
        placeholderTextColor="#777"
        onChangeText={setBio}
      />

      <Text style={styles.charCounter}>
        {bio.length}/{MAX_CHARS}
      </Text>

      <TouchableOpacity
        style={[styles.saveButton, bio.length === 0 && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={bio.length === 0}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", padding: 16 },
  label: { color: "white", marginBottom: 8, fontSize: 16 },
  textarea: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    color: "white",
    fontSize: 15,
    textAlignVertical: "top",
  },
  charCounter: {
    textAlign: "right",
    color: "#999",
    fontSize: 12,
    marginTop: 6,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  disabledButton: { backgroundColor: "#334155" },
});
