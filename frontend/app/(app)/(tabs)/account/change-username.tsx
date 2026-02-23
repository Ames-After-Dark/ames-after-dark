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

// Updated service import
import { getUserById, updateUser } from "@/services/userService";

export default function ChangeUsernameScreen() {
  const [username, setUsername] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // receive from auth, current test user
  const currentUserId = 10;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = await getUserById(currentUserId);

        setOriginalUsername(user.username || "");
        setUsername(user.username || "");
      } catch (err) {
        setError("Failed to load current username");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [currentUserId]);

  const validateUsername = (value: string): string | null => {
    if (!value.trim()) return "Username cannot be empty";
    if (value.length < 3) return "Username must be at least 3 characters";
    if (value === originalUsername)
      return "This is already your current username";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateUsername(username);

    if (validationError) {
      Alert.alert("Error", validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // update user
      await updateUser(currentUserId, { username });

      Alert.alert("Success", "Username updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update username";

      setError(message);
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const isDisabled =
    saving ||
    !username.trim() ||
    username === originalUsername;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Stack.Screen
          options={{
            title: "Change Username",
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
        placeholderTextColor="#888"
        onChangeText={setUsername}
        editable={!saving}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[
          styles.saveButton,
          isDisabled && styles.saveButtonDisabled,
        ]}
        onPress={handleSubmit}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.saveButtonText}>
            Save Username
          </Text>
        )}
      </TouchableOpacity>

      <Text style={styles.helperText}>
        • Username must be at least 3 characters{"\n"}
        • Username cannot be empty
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b12",
    padding: 16,
  },

  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },

  infoContainer: {
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#1f2937",
  },

  infoText: {
    color: "#ccc",
    fontSize: 14,
  },

  currentUsername: {
    color: "#33CCFF",
    fontWeight: "600",
  },

  label: {
    color: "white",
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "500",
  },

  input: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },

  saveButton: {
    backgroundColor: "#33CCFF",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },

  saveButtonDisabled: {
    backgroundColor: "#1f2937",
    opacity: 0.5,
  },

  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginBottom: 8,
  },

  helperText: {
    color: "#888",
    fontSize: 13,
    marginTop: 16,
    lineHeight: 20,
  },
});

