import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Image, FlatList, ActivityIndicator, 
  StyleSheet, Dimensions, Modal, TouchableOpacity, } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Photo } from "@/services/photosService"
import { getPhotosByAlbumUri } from "@/services/photosService";
import { Theme } from "@/constants/theme";
import ImageViewing from "react-native-image-viewing";

const windowWidth = Dimensions.get("window").width;
const PHOTO_SIZE = windowWidth / 3;

export default function BarPhotosScreen() {
  const { albumUri, barName } = useLocalSearchParams();
  const router = useRouter();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isViewerVisible, setViewerVisible] = useState(false);

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

  const imageSources = photos.map((p) => ({ uri: p.image.uri }));

  return (
    <View style={styles.container}>
      {/* Bar name header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.barTitle}>{barName}</Text>
      </View>
      {/* Grid of photos */}
      <FlatList
        data={photos}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        renderItem={({ item, index }) => (
          <TouchableOpacity onPress={() => {
          setCurrentIndex(index); setViewerVisible(true);}}>
            <Image source={item.image} style={styles.photo} resizeMode="cover" />
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Clickable full-screen image */}
      <ImageViewing images={imageSources} imageIndex={currentIndex}
        visible={isViewerVisible} onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled={true} doubleTapToZoomEnabled={true}
        // Back button
        HeaderComponent={() => (
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => {setViewerVisible(false);}}>
              <Text style={styles.viewerBackArrow}>←</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Theme.dark.background,
  },
  backArrow: {
    color: Theme.container.titleText,
    fontSize: 26,
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
  viewerHeader: {
    position: "absolute",
    top: 45,
    left: 25,
    zIndex: 20,
  },
  viewerBackArrow: {
    fontSize: 34,
    color: Theme.dark.primary,
    fontWeight: "700",
  },
});
