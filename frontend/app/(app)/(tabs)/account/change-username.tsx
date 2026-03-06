import React, { useState, useEffect, useRef } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { checkUsernameAvailability, updateUsernameByAuth } from "@/services/userService";

export default function ChangeUsernameScreen() {
  const { username: currentUsername, getAccessToken, refreshUsername } = useAuth();
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const usernameCheckTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Set current username when component mounts
    if (currentUsername) {
      setUsername("");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [currentUsername]);

  // Validate username format
  const validateUsernameFormat = (username: string): { valid: boolean; error: string | null } => {
    if (username.length === 0) {
      return { valid: false, error: null };
    }
    if (username.length < 3 || username.length > 20) {
      return { valid: false, error: 'Username must be 3-20 characters' };
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return { valid: false, error: 'Only letters, numbers, _ and - allowed' };
    }
    return { valid: true, error: null };
  };

  // Check username availability with debounce
  useEffect(() => {
    // Clear previous timeout
    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Reset status if username is empty
    if (username.length === 0) {
      setUsernameStatus('idle');
      setUsernameError(null);
      return;
    }

    // Check if it's the same as current username
    if (username === currentUsername) {
      setUsernameStatus('invalid');
      setUsernameError('This is already your current username');
      return;
    }

    // Validate format first
    const formatValidation = validateUsernameFormat(username);
    if (!formatValidation.valid) {
      setUsernameStatus('invalid');
      setUsernameError(formatValidation.error);
      return;
    }

    // Set checking status immediately for valid format
    setUsernameStatus('checking');
    setUsernameError(null);

    // Debounce the API call
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(username);
        if (result.available) {
          setUsernameStatus('available');
          setUsernameError(null);
        } else {
          setUsernameStatus('taken');
          setUsernameError('Username is already taken');
        }
      } catch (error) {
        console.error('Error checking username:', error);
        setUsernameStatus('invalid');
        setUsernameError('Error checking username');
      }
    }, 500); // 500ms debounce

    // Cleanup
    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, [username, currentUsername]);

  const handleSubmit = async () => {
    // Validate username
    if (username.length === 0) {
      Alert.alert("Error", "Please enter a username");
      return;
    }

    if (username === currentUsername) {
      Alert.alert("Error", "This is already your current username");
      return;
    }

    const formatValidation = validateUsernameFormat(username);
    if (!formatValidation.valid) {
      Alert.alert("Invalid Username", formatValidation.error || "Please enter a valid username");
      return;
    }

    if (usernameStatus !== 'available') {
      Alert.alert("Username Unavailable", "Please choose an available username");
      return;
    }

    try {
      setSaving(true);

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      await updateUsernameByAuth(accessToken, username);

      // Refresh username in auth context
      await refreshUsername();

      Alert.alert("Success", "Username updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      const message = error.message || "Failed to update username";
      Alert.alert("Error", message);
    } finally {
      setSaving(false);
    }
  };

  const isDisabled = saving || usernameStatus !== 'available';

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
            {currentUsername || "Not set"}
          </Text>
        </Text>
      </View>

      <Text style={styles.label}>New Username</Text>

      <View style={{ position: 'relative' }}>
        <TextInput
          style={[
            styles.input,
            usernameStatus === 'available' && styles.inputValid,
            (usernameStatus === 'taken' || usernameStatus === 'invalid') && styles.inputInvalid
          ]}
          value={username}
          placeholder="Enter new username"
          placeholderTextColor="#888"
          onChangeText={setUsername}
          editable={!saving}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {usernameStatus === 'checking' && (
          <View style={styles.inputIcon}>
            <ActivityIndicator size="small" color="#888" />
          </View>
        )}
        {usernameStatus === 'available' && (
          <View style={styles.inputIcon}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
        {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
          <View style={styles.inputIcon}>
            <Text style={styles.xmark}>✗</Text>
          </View>
        )}
      </View>

      {usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
      {usernameStatus === 'available' && (
        <Text style={styles.successText}>Username is available!</Text>
      )}

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
        • Username must be 3-20 characters{"\n"}
        • Only letters, numbers, _ and - allowed{"\n"}
        • Username must be unique
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
    paddingRight: 50, // Make room for icon
    marginBottom: 12,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#1f2937",
  },

  inputValid: {
    borderColor: "#10b981",
    borderWidth: 2,
  },

  inputInvalid: {
    borderColor: "#ef4444",
    borderWidth: 2,
  },

  inputIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
  },

  checkmark: {
    color: "#10b981",
    fontSize: 20,
    fontWeight: "600",
  },

  xmark: {
    color: "#ef4444",
    fontSize: 20,
    fontWeight: "600",
  },

  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 8,
  },

  successText: {
    color: "#10b981",
    fontSize: 14,
    marginBottom: 8,
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

  helperText: {
    color: "#888",
    fontSize: 13,
    marginTop: 16,
    lineHeight: 20,
  },
});

