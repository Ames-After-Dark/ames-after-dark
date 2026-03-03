// components/TopHeader.tsx
import { View, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TopHeader() {
  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0B0C12" }}>
      <View style={styles.wrap}>
        {/* Logo */}
        <Image
          source={require("../assets/images/LogoTopBar.png")}
          style={{ width: 170, height: 32 }}
          resizeMode="contain"
        />
      </View>

      {/* Testing-only time display */}
      {/* <Text style={styles.testTimeText}>
        Simulated Time: {formatted} (Testing), Mock Data: True
      </Text> */}
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
