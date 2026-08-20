import { View, Text, StyleSheet } from "react-native";
import { Theme } from "@/constants/theme";

export default function ChangeProfilePictureScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile picture</Text>
      <Text style={styles.body}>Profile picture editing is available from your profile page.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: Theme.container.titleText,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  body: {
    color: Theme.container.inactiveText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
