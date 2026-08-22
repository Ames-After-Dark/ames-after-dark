import React from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";

type GuestSignInPromptProps = {
  title: string;
  message: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
};

export function GuestSignInPrompt({
  title,
  message,
  icon = "person-circle-outline",
}: GuestSignInPromptProps) {
  const { signIn, isLoading } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={42} color={Theme.dark.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <TouchableOpacity style={styles.button} onPress={() => signIn()} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color={Theme.dark.white} />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 320,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.dark.background,
  },
  iconCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.search.background,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
    marginBottom: 18,
  },
  title: {
    color: Theme.container.titleText,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    color: Theme.container.inactiveText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 22,
  },
  button: {
    minWidth: 180,
    minHeight: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.dark.primary,
  },
  buttonText: {
    color: Theme.dark.white,
    fontSize: 16,
    fontWeight: "800",
  },
});
