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
import { useAuth } from "@/hooks/use-auth";
import { getUserProfileByAuth, updateBioByAuth } from "@/services/userService";

export default function ChangeBioScreen() {
  const MAX_CHARS = 150;
  const { getAccessToken } = useAuth();

  const [bio, setBio] = useState("");
  const [originalBio, setOriginalBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const accessToken = await getAccessToken();
        if (!accessToken) {
          throw new Error('No access token available');
        }

        const profile = await getUserProfileByAuth(accessToken);
        const fetchedBio = profile?.bio ?? "";

        setOriginalBio(fetchedBio);
        setBio(fetchedBio);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError("Failed to load bio");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const getCharCountColor = (): string => {
    const remaining = MAX_CHARS - bio.length;
    if (remaining < 20) return "#ef4444"; // Red when close to limit
    if (remaining < 50) return "#f59e0b"; // Orange when getting close
    return "#10b981"; // Green otherwise
  };

  const handleSubmit = async () => {
    const trimmedBio = bio.trim();

    if (trimmedBio.length > MAX_CHARS) {
      Alert.alert("Error", `Bio must be under ${MAX_CHARS} characters`);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const accessToken = await getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available');
      }

      await updateBioByAuth(accessToken, trimmedBio);

      // Update original so button disables properly
      setOriginalBio(trimmedBio);

      Alert.alert("Success", "Bio updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      const message = err.message || "Failed to update bio";
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

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Write a short bio to tell others about yourself.
        </Text>
      </View>

      <Text style={styles.label}>Your Bio</Text>

      <View style={styles.textareaContainer}>
        <TextInput
          style={[
            styles.textarea,
            bio.length > MAX_CHARS && styles.textareaError
          ]}
          value={bio}
          multiline
          maxLength={MAX_CHARS + 50} // Allow typing past limit to show error
          placeholder="Write something about yourself..."
          placeholderTextColor="#777"
          onChangeText={setBio}
          editable={!saving}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.charCounterContainer}>
        <Text style={[styles.charCounter, { color: getCharCountColor() }]}>
          {bio.length}/{MAX_CHARS}
        </Text>
        {bio.length > MAX_CHARS && (
          <Text style={styles.overLimitText}>
            {bio.length - MAX_CHARS} characters over limit
          </Text>
        )}
      </View>

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

      <Text style={styles.helperText}>
        • Bio is optional{"\n"}
        • Maximum {MAX_CHARS} characters{"\n"}
        • Visible to other users
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b12",
    padding: 16
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center"
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
    lineHeight: 20,
  },
  label: {
    color: "white",
    marginBottom: 8,
    fontSize: 16,
    fontWeight: "500"
  },
  textareaContainer: {
    marginBottom: 8,
  },
  textarea: {
    backgroundColor: "#0f172a",
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    color: "white",
    fontSize: 15,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  textareaError: {
    borderColor: "#ef4444",
    borderWidth: 2,
  },
  charCounterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  charCounter: {
    fontSize: 14,
    fontWeight: "600",
  },
  overLimitText: {
    color: "#ef4444",
    fontSize: 12,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#33CCFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600"
  },
  disabledButton: {
    backgroundColor: "#1f2937",
    opacity: 0.5,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 10
  },
  helperText: {
    color: "#888",
    fontSize: 13,
    lineHeight: 20,
  },
});

