// components/TopHeader.tsx
import { View, Image, Pressable, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getNow } from "@/config/time"; // import shared helper
import { router } from 'expo-router';

export default function TopHeader() {
  const now = getNow();

  // Include weekday and local time
  const formatted = now.toLocaleString([], {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0B0C12" }}>
      <View style={styles.wrap}>
        {/* Logo */}
        <Image
          source={require("../assets/images/LogoTopBar.png")}
          style={{ width: 170, height: 32 }}
          resizeMode="contain"
        />

        {/* Settings button (disabled for now) */}
        <Pressable
          onPress={() => router.push('/friends/account')}
          disabled={false}
          hitSlop={8}
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={22} color="#d4d4d8" />
        </Pressable>
      </View>

      {/* Testing-only time display */}
      <Text style={styles.testTimeText}>
        Simulated Time: {formatted} (Testing), Mock Data: True
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
    backgroundColor: "#0B0C12",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  testTimeText: {
    color: "#38bdf8",
    textAlign: "center",
    fontSize: 12,
    opacity: 0.85,
    paddingBottom: 6,
    backgroundColor: "#0B0C12",
  },
});
