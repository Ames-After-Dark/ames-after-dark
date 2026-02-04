import React, { useState, useEffect } from "react";
import { View, Text, Image, FlatList, ActivityIndicator, 
  StyleSheet, Dimensions, Alert, TouchableOpacity, } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { Photo } from "@/services/photosService";
import { getPhotosByAlbumUri } from "@/services/photosService";
import { Theme } from "@/constants/theme";
import ImageViewing from "react-native-image-viewing"; //fixing compile error - try installing
import { FontAwesome } from "@expo/vector-icons";
import { File, Directory, Paths} from 'expo-file-system';
import * as MediaLibrary from "expo-media-library"; //fixing compile error - try installing

const windowWidth = Dimensions.get("window").width;
const PHOTO_SIZE = windowWidth / 3;

export default function BarPhotosScreen() {
  const { albumUri, barName } = useLocalSearchParams();
  const router = useRouter();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerIndex, setViewerIndex] = useState(0);
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

  // Helper function that handles enlarged photo downloads
  const handleDownload = async () => {
    try {
      const uri = photos[viewerIndex].image.uri;
      if (!uri) {
        Alert.alert("Invalid image", "This image cannot be downloaded.");
        return;
      }

      // Ask permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Needed", "Allow photo access to save images.");
        return;
      }

      // Create destination directory
      const folder = new Directory(Paths.cache, 'AmesAfterDark');
      if (!folder.exists) {
        await folder.create();
      }

      // Download file
      const downloadedFile = await File.downloadFileAsync(uri, folder);

      // Save to library
      await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
      Alert.alert("Saved", "Photo saved to your camera roll!");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not download image.");
    }
  };

  // Helped function that handles long press grid photo downloads
  const handleGridDownload = async (index: number) => {
    try {
      const uri = photos[index].image.uri;
      if (!uri) {
        Alert.alert("Invalid image", "This image cannot be downloaded.");
        return;
      }

      // Ask permission
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Needed", "Allow photo access to save images.");
        return;
      }

      // Create destination directory
      const folder = new Directory(Paths.cache, 'AmesAfterDark');
      if (!folder.exists) {
        await folder.create();
      }

      // Download file
      const downloadedFile = await File.downloadFileAsync(uri, folder);

      // Save to library
      await MediaLibrary.saveToLibraryAsync(downloadedFile.uri);
      Alert.alert("Saved", "Photo saved to your camera roll!");
    } catch (err) {
      console.log(err);
      Alert.alert("Error", "Could not download image.");
    }
  };

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
          setCurrentIndex(index); setViewerVisible(true); setViewerIndex(index);}}
          onLongPress={() => handleGridDownload(index)} delayLongPress={400}>
            <Image source={item.image} style={styles.photo} resizeMode="cover" />
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Clickable full-screen image */}
      <ImageViewing images={imageSources} imageIndex={currentIndex}
        visible={isViewerVisible} onRequestClose={() => setViewerVisible(false)}
        swipeToCloseEnabled={true} doubleTapToZoomEnabled={true}
        onImageIndexChange={(index) => setViewerIndex(index)}
        HeaderComponent={() => (
          <View style={styles.viewerHeader}>
            <TouchableOpacity onPress={() => {setViewerVisible(false);}}>
              <Text style={styles.viewerBackArrow}>←</Text>
            </TouchableOpacity>
            <View style={styles.viewerHeaderRight}>
              <TouchableOpacity onPress={handleDownload}>
                <FontAwesome name="download" style={styles.downloadIcon} />
              </TouchableOpacity>
            </View>
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
    top: 50,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewerHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewerBackArrow: {
    fontSize: 34,
    color: Theme.dark.primary,
  },
  downloadIcon: {
    fontSize: 34,
    color: Theme.dark.primary,
  },
});
