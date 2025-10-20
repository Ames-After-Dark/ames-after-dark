import React from "react";
import { View, Text, Image, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useBarPhotos } from "../../hooks/useBarPhotos";

export default function BarPhotosScreen() {
  const { barId } = useLocalSearchParams();
  const { photos, loading, error } = useBarPhotos(Number(barId));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;
  if (error) return <Text style={styles.error}>Error: {error}</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos</Text>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        renderItem={({ item }) => (
          <Image source={{ uri: item.url }} style={styles.photo} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 8 },
  title: { fontSize: 22, fontWeight: "bold", margin: 8 },
  photo: { width: "48%", aspectRatio: 1, margin: "1%" },
  error: { color: "red", textAlign: "center", marginTop: 20 },
});
