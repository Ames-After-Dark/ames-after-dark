import { View, Text, Button, StyleSheet } from "react-native";
import { Stack } from "expo-router";

export default function ChangeProfilePictureScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: "Change Profile Picture" }} />
      <Text style={styles.text}>
        Profile picture update feature coming soon!
      </Text>
      <Button title="Upload Image" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", padding: 16 },
  text: { color: "white", marginBottom: 16 },
});
