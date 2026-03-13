// components/tonight/FriendsSection.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Theme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function FriendsSection() {
  return (
    <View style={styles.friendsContainer}>
      <View style={styles.iconCircle}>
        <Ionicons name="people-outline" size={48} color={Theme.dark.primary} />
      </View>
      <Text style={styles.comingSoonHeader}>Friends coming soon!</Text>
      <Text style={styles.emptyText}>
        We're working on a feature to help you find where your friends are hanging out in Ames.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  friendsContainer: {
    flex: 1,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.search.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
  },
  comingSoonHeader: {
    color: Theme.container.titleText,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: Theme.container.inactiveText,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
});