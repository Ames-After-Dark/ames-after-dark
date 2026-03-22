import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router'; // Add usePathname
import { Theme } from "@/constants/theme";

export default function TopHeader() {
  const pathname = usePathname();

  // 1. Check if we are on ANY account-related page
  const isAccountPath = pathname.startsWith('/account');

  // 2. Logic: If we are on a sub-page (like a friend's ID), show Back. 
  // If we are on our own ID (isMe check) or the root, show Gear.
  // For now, let's just make the Gear show up on any /account page:

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0B0C12" }}>
      <View style={styles.wrap}>
        {/* BACK BUTTON: Only show if we aren't at the "root" of a tab */}
        {/* You can add a condition here if you want a back arrow for friends */}

        <Image
          source={require("../assets/images/LogoTopBar.png")}
          style={{ width: 170, height: 32 }}
          resizeMode="contain"
        />

        {isAccountPath ? (
          <TouchableOpacity onPress={() => router.push('/account/settings' as any)}>
            <FontAwesome name="gear" size={24} color={Theme.container.inactiveText} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
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
    justifyContent: "space-between", // This pushes logo left and gear right
  },
});