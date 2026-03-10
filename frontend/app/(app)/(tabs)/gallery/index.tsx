import React, { useEffect, useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, 
  TextInput, ActivityIndicator, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { shouldForceErrorPage } from "@/utils/dev-error-pages";
import ErrorState from "@/components/ui/error-state";
import { Theme } from "@/constants/theme";
import { getLatestWeekendAlbums } from "@/services/galleryService";
import GalleryFallback from "./Galleryfallback";

function parseDateToken(token: string): Date | null {
  if (!token) return null;
  const parts = token.split(/[-\\/]/).map((p) => p.trim());
  if (parts.length !== 2) return null;

  const month = parseInt(parts[0], 10) - 1;
  const day = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(day)) return null;

  const now = new Date();
  let year = now.getFullYear();
  let candidate = new Date(year, month, day);
  if (candidate > now) candidate = new Date(year - 1, month, day);
  return candidate;
}

export default function GalleryScreen() {
  const router = useRouter();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLatestWeekendAlbums();
        setAlbums(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load gallery"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasError = !!error || shouldForceErrorPage("gallery");

  const filteredAlbums = useMemo(() => {
    let data = albums;
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (a) =>
          a.barName?.toLowerCase().includes(q) ||
          a.name?.toLowerCase().includes(q)
      );
    }
    return data;
  }, [albums, search]);

  const grouped = useMemo(() => {
    const byDate: Record<string, any[]> = {};
    const dateObjMap: Record<string, Date | null> = {};

    for (const a of filteredAlbums) {
      if (!a.date) continue;
      const key = a.date;
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(a);
      if (!dateObjMap[key]) {
        dateObjMap[key] = parseDateToken(a.date) || null;
      }
    }

    const entries = Object.entries(byDate).map(([date, bars]) => ({
      date,
      bars,
      dateObj: dateObjMap[date] || new Date(0),
    }));

    entries.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
    return entries;
  }, [filteredAlbums]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.dark.primary} />
      </View>
    );

  if (hasError)
    return (
      <View style={styles.container}>
        <ErrorState title="Unable to load gallery" subtitle="Please try again later." />
      </View>
    );

  if (albums.length === 0)
    return <GalleryFallback />;

  return (
    <View style={styles.container}>
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={18} color={Theme.search.inactiveInput} style={styles.searchIcon} />
          <TextInput
            placeholder="Search Gallery"
            placeholderTextColor={Theme.search.inactiveInput}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
      </View>
      <FlatList
        data={grouped}
        keyExtractor={(item) => item.date}
        renderItem={({ item }) => {
          const { date, bars, dateObj } = item as { date: string; bars: any[]; dateObj: Date };
          const weekday = dateObj && !isNaN(dateObj.getTime())
            ? dateObj.toLocaleDateString(undefined, { weekday: "long" })
            : "";
          const header = weekday ? `${weekday} ${date}` : date;
          return (
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.dateHeader}>{header}</Text>
              <View style={styles.albumGrid}>
                {bars.map((album) => (
                  <TouchableOpacity
                    key={album.id}
                    style={styles.albumCard}
                    onPress={() =>
                      router.push({
                        pathname: "/(app)/(tabs)/gallery/[barId]",
                        params: { barId: album.id, barName: album.barName, albumUri: album.albumUri },
                      })
                    }
                  >
                    {album.coverUrl ? (
                      <Image source={{ uri: album.coverUrl }} style={styles.albumImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.placeholderCover} />
                    )}
                    <Text style={styles.albumName}>{album.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
    paddingHorizontal: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.dark.background,
  },
  searchFilterContainer: {
    backgroundColor: Theme.dark.background,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchBar: {
  marginHorizontal: 4,
  backgroundColor: Theme.search.background,
  borderColor: Theme.search.border,
  borderWidth: 1,
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
  marginBottom: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: Theme.search.input,
    fontSize: 14,
  },
  dateHeader: {
    color: Theme.container.titleText,
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 8,
    marginLeft: 4,
  },
  albumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  albumCard: {
    width: "48%",
    margin: "1%",
    backgroundColor: Theme.container.background,
    borderRadius: 12,
    overflow: "hidden",
  },
  albumImage: { width: "100%", height: 140 },
  albumName: {
    color: Theme.container.titleText,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  placeholderCover: {
    width: "100%",
    height: 140,
    backgroundColor: Theme.dark.black,
  },
});