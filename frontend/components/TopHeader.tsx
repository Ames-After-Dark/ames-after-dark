import { View, Image, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router'; // Add usePathname
import { Theme } from "@/constants/theme";

export default function TopHeader() {
  const pathname = usePathname();

  const isAccountPage = pathname === '/account' || pathname === '/(app)/(tabs)/account';

  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: "#0B0C12" }}>
      <View style={styles.wrap}>
        <Image
          source={require("../assets/images/LogoTopBar.png")}
          style={{ width: 170, height: 32 }}
          resizeMode="contain"
        />

        {isAccountPage ? (
          <TouchableOpacity onPress={() => router.push('/account/settings')}>
            <FontAwesome name="gear" size={24} color={Theme.container.inactiveText} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} /> // Keeps the logo centered/pushed left correctly
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