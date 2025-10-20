import React from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useBars } from "../../hooks/useBars";

export default function GalleryScreen() {
  const { bars, loading, error } = useBars();
  const router = useRouter();

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (error) return <Text style={styles.error}>Error: {error}</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={bars}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/gallery/${item.id}`)}
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
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 12 },
  card: { padding: 12, borderBottomWidth: 1, borderColor: "#ddd" },
  barName: { fontSize: 18 },
  barLocation: { color: "#666" },
  error: { color: "red", textAlign: "center", marginTop: 20 },
});
