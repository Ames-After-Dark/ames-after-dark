// components/TopHeader.tsx
import { View, Image, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

export default function TopHeader() {
  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0B0C12" }}>
      <View style={styles.wrap}>
        <Image
          source={require("../assets/images/LogoTopBar.png")}
          style={{ width: 170, height: 32 }}
          resizeMode="contain"
        />
        <Pressable
          onPress={() => {}}   disabled={true}
          hitSlop={8}
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={22} color="#d4d4d8" />
        </Pressable>
      </View>
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
});
