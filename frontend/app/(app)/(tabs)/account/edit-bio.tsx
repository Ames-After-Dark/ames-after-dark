import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";

import { getUserById, updateUser } from "@/services/userService";

export default function ChangeBioScreen() {
  const MAX_CHARS = 150;

  const [bio, setBio] = useState("");
  const [originalBio, setOriginalBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = 10; // replace with auth later

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = await getUserById(currentUserId);

        const fetchedBio = user?.bio ?? "";

        setOriginalBio(fetchedBio);
        setBio(fetchedBio);
      } catch (err) {
        setError("Failed to load bio");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [currentUserId]);

  const validateBio = (value: string): string | null => {
    if (value.length > MAX_CHARS) {
      return `Bio must be under ${MAX_CHARS} characters`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const trimmedBio = bio.trim();
    const validationError = validateBio(trimmedBio);

    if (validationError) {
      Alert.alert("Error", validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateUser(currentUserId, { bio: trimmedBio });

      // update original so button disables properly
      setOriginalBio(trimmedBio);

      Alert.alert("Success", "Bio updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update bio";

      setError(message);
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const isDisabled =
    saving ||
    bio.trim() === originalBio ||
    bio.length > MAX_CHARS;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Stack.Screen
          options={{
            title: "Edit Bio",
            headerBackTitle: "Settings",
            headerStyle: { backgroundColor: "#0b0b12" },
            headerTintColor: "white",
          }}
        />
        <ActivityIndicator size="large" color="#33CCFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Edit Bio",
          headerBackTitle: "Settings",
          headerStyle: { backgroundColor: "#0b0b12" },
          headerTintColor: "white",
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
        editable={!saving}
        textAlignVertical="top"
      />

      <Text style={styles.charCounter}>
        {bio.length}/{MAX_CHARS}
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[
          styles.saveButton,
          isDisabled && styles.disabledButton,
        ]}
        onPress={handleSubmit}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.saveButtonText}>Save Bio</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", padding: 16 },
  loadingContainer: { justifyContent: "center", alignItems: "center" },
  label: { color: "white", marginBottom: 8, fontSize: 16 },
  textarea: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    color: "white",
    fontSize: 15,
    textAlignVertical: "top",
    marginBottom: 12,
  },
  charCounter: { textAlign: "right", color: "#999", fontSize: 12, marginTop: 6, marginBottom: 20 },
  saveButton: { backgroundColor: "#3b82f6", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  disabledButton: { backgroundColor: "#334155" },
  errorText: { color: "#ff6b6b", fontSize: 14, marginBottom: 10 },
});

