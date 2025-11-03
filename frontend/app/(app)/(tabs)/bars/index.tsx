import { FontAwesome } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { useBars } from "@/hooks/useBars";
import type { Bar } from "@/types/bar";
import { IMG } from "../../../../assets/assets.ts";

export default function Bars() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const wantsOpen = filter === "Open Now";
  const wantsDeals = filter === "Specials";
  const wantsLive = filter === "Live Music";

  const { bars, loading } = useBars({
    open: wantsOpen || undefined,
    hasDeals: wantsDeals || undefined,
    liveMusic: wantsLive || undefined,
    q: search || undefined,
  });

  // --- favorites overlay fix ---
  const [fav, setFav] = useState<Record<string, boolean>>({});
  // Seed/extend local favorites from incoming bars without looping
// ✅ Safe seeding: runs only when bar IDs or their initial favorite states actually change
// Make a stable signature of just the bar IDs
const barIdsSig = useMemo(
  () => (bars && bars.length ? bars.map(b => String(b.id)).join(",") : ""),
  [bars]
);

// Seed local favorites ONLY when new IDs appear
useEffect(() => {
  if (!barIdsSig) return;
  setFav(prev => {
    let changed = false;
    const next = { ...prev };
    for (const b of bars) {
      const id = String(b.id);
      if (!(id in next)) {
        next[id] = !!b.favorite; // initial value; won't overwrite local toggles
        changed = true;
      }
    }
    return changed ? next : prev; // no change → no re-render
  });
}, [barIdsSig]); // <-- depends ONLY on IDs, not on entire bars objects



  const isFav = (b: Bar) => fav[String(b.id)] ?? !!b.favorite;
  const toggleFavorite = (id: string) =>
    setFav(prev => ({ ...prev, [id]: !(prev[id] ?? false) }));

  const visibleBars = useMemo(() => {
    let data = bars;
    if (filter === "Favorites") data = data.filter(b => isFav(b));
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        b =>
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q)
      );
    }
    return [...data].sort((a, b) => Number(isFav(b)) - Number(isFav(a)));
  }, [bars, filter, search, fav]);

  const renderBar = ({ item }: { item: Bar & { __openNow?: boolean } }) => {
    const firstDeal =
      item.dealsScheduled?.[0]?.title ??
      item.eventsScheduled?.[0]?.name ??
      "No specials tonight";
    const openNow = !!item.__openNow;
    const imageSource = item.logoUrl ? { uri: item.logoUrl } : IMG.LOGO;
    const id = String(item.id);
    const favOn = isFav(item);

    return (
      <TouchableOpacity onPress={() => router.push(`/bars/${item.id}`)}>
        <View style={styles.barCard}>
          <Image source={imageSource} style={styles.barImage} resizeMode="cover" />
          <View style={styles.barInfo}>
            <Text style={styles.barName}>{item.name}</Text>
            <Text style={styles.barStatus}>
              {openNow ? `Open - Until ${item.closingTime ?? ""}` : "Closed"}
            </Text>
            <Text style={styles.barSpecials}>{firstDeal}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(id)}>
            <FontAwesome name="star" size={22} color={favOn ? "#33CCFF" : "grey"} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={18} color="#33CCFF" style={styles.searchIcon} />
          <TextInput
            placeholder="Search bars or keywords"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.filters}>
          {["All", "Open Now", "Specials", "Live Music", "Favorites"].map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.filterButton, filter === option && styles.activeFilter]}
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
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color="#33CCFF" />
      ) : (
        <FlatList
          data={visibleBars}
          renderItem={renderBar}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.barList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

// your original styles block re-attached 👇
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12" },
  searchFilterContainer: { backgroundColor: "#1A1A1A", paddingVertical: 12, paddingHorizontal: 14 },
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 10 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: "#94A3B8", fontSize: 14 },
  filters: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center" },
  filterButton: { backgroundColor: "#1A1A1A", borderColor: "#33CCFF", borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, marginHorizontal: 6 },
  activeFilter: { backgroundColor: "#33CCFF" },
  filterText: { color: "white", fontSize: 13 },
  barList: { paddingBottom: 80 },
  barCard: { flexDirection: "row", backgroundColor: "#1A1A1A", borderRadius: 16, padding: 12, marginVertical: 6, alignItems: "center" },
  barImage: { width: 70, height: 70, borderRadius: 12, marginRight: 12 },
  barInfo: { flex: 1 },
  barName: { color: "white", fontSize: 18, fontWeight: "600" },
  barStatus: { color: "white", fontSize: 14, fontWeight: "500" },
  barSpecials: { color: "white", fontSize: 14, marginVertical: 2 },
});
