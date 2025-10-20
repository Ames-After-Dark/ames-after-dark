import React from "react";
import { View, Text, Image, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useBarPhotos } from "../../hooks/useBarPhotos";
import { Theme } from "../../constants/theme";

export default function BarPhotosScreen() {
  const { barId } = useLocalSearchParams();
  const { photos, loading, error } = useBarPhotos(Number(barId));

  if (loading)
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={Theme.dark.primary} />
      </View>
    );

  if (error)
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos</Text>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => (
          <Image
            source={item.image} // dummy image from assets
            style={styles.photo}
            resizeMode="cover"
          />
        )}
      />
    </View>
  );
}

// This sets the header/title for this screen
export const screenOptions = {
  headerShown: true,
  headerTitle: "Bar Photos",
  headerStyle: {
    backgroundColor: Theme.dark.surface,
  },
  headerTitleStyle: {
    color: Theme.dark.primary,
  },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
    padding: 8,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: Theme.dark.primary,
    margin: 8,
  },
  photo: {
    width: 150,
    height: 150,
    margin: 4,
    borderRadius: 8,
  },
  error: {
    color: Theme.dark.error,
    textAlign: "center",
    marginTop: 20,
  },
});
