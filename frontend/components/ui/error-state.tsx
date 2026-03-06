import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Theme } from "@/constants/theme";

type ErrorStateProps = {
  title: string;
  subtitle?: string;
};

export default function ErrorState({
  title,
  subtitle = "Please try again later.",
}: ErrorStateProps) {
  return (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle-outline" size={48} color={Theme.dark.primary} />
      <Text style={styles.errorText}>{title}</Text>
      <Text style={styles.errorSubtext}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.dark.background,
    paddingHorizontal: 20,
  },
  errorText: {
    color: Theme.container.titleText,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  errorSubtext: {
    color: Theme.container.inactiveText,
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
});