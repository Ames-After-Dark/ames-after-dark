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

export default function ChangeEmailScreen() {
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Replace with real auth user ID later
  const currentUserId = 10;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const user = await getUserById(currentUserId);

        const fetchedEmail = user?.email ?? "";

        setOriginalEmail(fetchedEmail.toLowerCase());
        setEmail(fetchedEmail);
      } catch (err) {
        setError("Failed to load current email");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [currentUserId]);

  const validateEmail = (value: string): string | null => {
    const normalized = value.trim().toLowerCase();

    if (!normalized) return "Email cannot be empty";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalized)) {
      return "Please enter a valid email address";
    }

    if (normalized === originalEmail) {
      return "This is already your current email";
    }

    return null;
  };

  const handleSave = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const validationError = validateEmail(normalizedEmail);

    if (validationError) {
      Alert.alert("Error", validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updateUser(currentUserId, { email: normalizedEmail });

      // Update local state after successful save
      setOriginalEmail(normalizedEmail);
      setEmail(normalizedEmail);

      Alert.alert("Success", "Email updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";

      setError(message);
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const normalizedEmail = email.trim().toLowerCase();

  const isDisabled =
    saving ||
    !normalizedEmail ||
    normalizedEmail === originalEmail;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Stack.Screen
          options={{
            title: "Change Email",
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
          title: "Change Email",
          headerBackTitle: "Settings",
          headerStyle: { backgroundColor: "#0b0b12" },
          headerTintColor: "white",
        }}
      />

      <Text style={styles.label}>New Email</Text>

      <TextInput
        style={styles.input}
        value={email}
        placeholder="Enter new email"
        placeholderTextColor="#999"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={setEmail}
        editable={!saving}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}

      <TouchableOpacity
        style={[
          styles.button,
          isDisabled && styles.disabledButton,
        ]}
        onPress={handleSave}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.buttonText}>Save Email</Text>
        )}
      </TouchableOpacity>
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

  label: {
    color: "white",
    marginBottom: 8,
    fontSize: 16,
  },

  input: {
    backgroundColor: "#1f2937",
    borderRadius: 10,
    padding: 12,
    color: "white",
    fontSize: 15,
    marginBottom: 12,
  },

  button: {
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: "#1f2937",
    opacity: 0.5,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  errorText: {
    color: "#ff6b6b",
    fontSize: 14,
    marginBottom: 8,
  },
});
