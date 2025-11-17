import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import React, { useState } from "react";

export default function PrivacyScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0b0b12", padding: 16 }}>
      <Stack.Screen options={{ title: "Privacy Settings" }} />
      <Text style={{ color: "white" }}>Privacy controls coming soon.</Text>
    </View>
  );
}
