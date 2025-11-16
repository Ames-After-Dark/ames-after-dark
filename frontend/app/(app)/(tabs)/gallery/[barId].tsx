import React, { useState, useEffect } from "react";
import { View, Text, Image, FlatList, ActivityIndicator, 
  StyleSheet, Dimensions, Modal, TouchableOpacity, } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Photo } from "@/services/photosService"
import { getPhotosByAlbumUri } from "@/services/photosService";
import { Theme } from "@/constants/theme";

const windowWidth = Dimensions.get("window").width;
const PHOTO_SIZE = windowWidth / 3;

export default function BarPhotosScreen() {
  const { albumUri, barName } = useLocalSearchParams();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);

  // load album
  useEffect(() => {
    (async () => {
      const p = await getPhotosByAlbumUri(String(albumUri));
      setPhotos(p);
      setLoading(false);
    })();
  }, [albumUri]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.dark.primary} />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: Theme.dark.background }}>
      {/* Bar name header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.barTitle}>{barName}</Text>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedPhoto(item.image.uri)}>
            <Image source={item.image} style={styles.photo} resizeMode="cover" />
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Clickable full-screen image */}
      <Modal visible={!!selectedPhoto} transparent>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.backButton} onPress={() => setSelectedPhoto(null)}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>

            {selectedPhoto && (
              <Image source={{ uri: selectedPhoto }} style={styles.modalImage} resizeMode="contain"
              onLoadStart={() => setImageLoading(true)} onLoadEnd={() => setImageLoading(false)} />
            )}

            {imageLoading && (
              <ActivityIndicator size="large" color={Theme.dark.primary} style={styles.loadingIndicator} />
            )}
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Theme.dark.background,
  },
  backArrow: {
    color: Theme.container.titleText,
    fontSize: 24,
    marginRight: 10,
  },
  barTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Theme.container.titleText,
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: "90%",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  loadingIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -15,
    marginTop: -15,
  },
});
