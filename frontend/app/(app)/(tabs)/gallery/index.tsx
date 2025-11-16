import React, { useEffect, useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, 
  TextInput, ActivityIndicator, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Theme } from "@/constants/theme";
import { getAlbums } from "@/services/photosService";

export default function GalleryScreen() {
  const router = useRouter();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const data = await getAlbums();
      setAlbums(data);
      setLoading(false);
    })();
  }, []);

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

  // group by date
  const grouped = useMemo(() => {
    const byDate: Record<string, any[]> = {};
    for (const a of filteredAlbums) {
      if (!a.date) continue;
      if (!byDate[a.date]) byDate[a.date] = [];
      byDate[a.date].push(a);
    }
    return Object.entries(byDate).sort((a, b) => {
      const dateeA = new Date(a[0]);
      const dateB = new Date(b[0]);
      return dateB.getTime() - dateeA.getTime();
    });
  }, [filteredAlbums]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.dark.primary} />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Search & Filters */}
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
        {/* Non-functional filters atm */}
        {/* <View style={styles.filters}>
          {["Thursday", "Friday", "Saturday", "By Bar"].map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.filterButton,
                filter === option && styles.activeFilter,
              ]}
              onPress={() => setFilter(option)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === option && { color: "black", fontWeight: "600" },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
          ))}
        </View> */}
      </View>
      {/* Album list */}
      <FlatList
        data={grouped}
        keyExtractor={(item => item[0])}
        renderItem={({ item: [date, bars] }) => (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.dateHeader}>{date}</Text>
            <View style={styles.albumGrid}>
              {bars.map((album) => (
                <TouchableOpacity
                  key={album.id}
                  style={styles.albumCard}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/(tabs)/gallery/[barId]",
                      params: { barId: album.id, barName: album.barName, albumUri: album.albumUri, },
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
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
    paddingHorizontal: 12
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchFilterContainer: {
    backgroundColor: Theme.container.background,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Theme.search.input,
    fontSize: 14
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center"
  },
  filterButton: {
    backgroundColor: Theme.container.background, // "#1A1A1A",
    borderColor: Theme.dark.primary, // "#33CCFF",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginHorizontal: 6
  },
  activeFilter: {
    backgroundColor: Theme.dark.primary
  },
  filterText: {
    color: Theme.container.activeText, // "white",
    fontSize: 13
  },
  dateHeader: {
    color: Theme.container.titleText, // Theme.dark.primary,
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
    backgroundColor: Theme.container.background, // "#1A1A1A",
    borderRadius: 12,
    overflow: "hidden",
  },
  albumImage: { width: "100%", height: 140 },
  albumName: {
    color: Theme.container.titleText, // "white",
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  placeholderCover: {
    width: "100%",
    height: 140,
    backgroundColor: Theme.dark.black, // "#333",
  },
});
