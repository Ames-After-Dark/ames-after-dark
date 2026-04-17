import React from 'react';
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Stack } from "expo-router";
import { FontAwesome } from '@expo/vector-icons';

export default function PrivacyScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Privacy Settings',
          headerBackTitle: 'Settings',
          headerStyle: {
            backgroundColor: '#0b0b12',
          },
          headerShadowVisible: false, // Cleaner look for dark mode
          headerTintColor: 'white',
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome name="shield" size={80} color="#33CCFF" />
        </View>

        <Text style={styles.title}>Privacy Controls</Text>
        <Text style={styles.subtitle}>
          We take your privacy seriously. We're currently building tools to give you more control over your data and visibility in Ames.
        </Text>

        <View style={styles.card}>
          <Text style={styles.comingSoonText}>
            <FontAwesome name="clock-o" size={16} color="#94a3b8" /> Coming in the next update
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b12",
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
    opacity: 0.8,
  },
  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  comingSoonText: {
    color: "#E5E5EE",
    fontSize: 14,
    fontWeight: '600',
  }
});