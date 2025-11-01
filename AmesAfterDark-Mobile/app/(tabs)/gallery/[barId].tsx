import React from "react";
import { View, Text, Image, FlatList, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useBarPhotos } from "@/src/hooks/useBarPhotos";
import { Theme } from "@/constants/theme";

const windowWidth = Dimensions.get("window").width;
const PHOTO_SIZE = windowWidth / 3;

export default function BarPhotosScreen() {
  const { barId, barName } = useLocalSearchParams();
  const { photos, loading, error } = useBarPhotos(String(barId));

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.dark.primary} />
      </View>
    );

  if (error)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: Theme.dark.background }}>
      {/* Bar name header */}
      <View style={styles.header}>
        <Text style={styles.barTitle}>{barName}</Text>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        renderItem={({ item }) => (
          <Image source={item.image} style={styles.photo} resizeMode="cover" />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// export const screenOptions = {
//   headerShown: true,
//   headerTitle: "Bar Photos",
//   headerStyle: {
//     backgroundColor: Theme.dark.surface,
//   },
//   headerTitleStyle: {
//     color: Theme.dark.primary,
//   },
// };

const styles = StyleSheet.create({
  header: {
    padding: 12,
    backgroundColor: Theme.dark.surface,
  },
  barTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.dark.primary,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.dark.background,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  },
  error: {
    color: Theme.dark.error,
    textAlign: "center",
    marginTop: 20,
  },
});
