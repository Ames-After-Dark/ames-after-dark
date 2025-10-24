import React from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useBars } from "../../../../hooks/useBars";
import { Theme } from "../../../../constants/theme";

export default function GalleryScreen() {
  const { bars, loading, error } = useBars();
  const router = useRouter();

  if (loading)
    return <ActivityIndicator style={{ flex: 1, justifyContent: "center" }} size="large" color={Theme.dark.primary} />;

  if (error)
    return <Text style={styles.error}>Error: {error}</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={bars}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingVertical: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/gallery/[barId]",
                params: { barId: item.id.toString(), barName: item.name },
              })
            }
          >
            <Text style={styles.barName}>{item.name}</Text>
            <Text style={styles.barLocation}>{item.location}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: Theme.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4, // Android shadow
  },
  barName: {
    fontSize: 18,
    fontWeight: "600",
    color: Theme.dark.primary,
    marginBottom: 4,
  },
  barLocation: {
    fontSize: 14,
    color: Theme.dark.muted,
  },
  error: {
    color: Theme.dark.error,
    textAlign: "center",
    marginTop: 20,
  },
});
