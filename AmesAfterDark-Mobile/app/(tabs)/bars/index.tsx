import { FontAwesome } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { BARS_BASE, BarBase } from "@/data/mock";
import { getNow, isActive, isBarOpen } from "@/constants/time";

export default function Bars() {
  const [bars, setBars] = useState<BarBase[]>(BARS_BASE);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const router = useRouter();
  const now = getNow();

  // ---------- Filtering ----------
  const filteredBars = bars
    .filter((bar) => {
      if (filter === "All") return true;
      if (filter === "Open Now") return isBarOpen(bar, now);

      if (filter === "Specials") {
        // Active scheduled deals OR any deals present
        const hasActiveScheduled =
          bar.dealsScheduled?.some((d) => isActive(d.rule, now)) ?? false;
        const hasAnyDeals = (bar.dealsScheduled?.length ?? 0) > 0;

        return hasActiveScheduled || hasAnyDeals;
      }

      if (filter === "Live Music") {
        return (
          bar.eventsScheduled?.some(
            (e) =>
              e.name.toLowerCase().includes("live") ||
              e.name.toLowerCase().includes("band") ||
              e.name.toLowerCase().includes("dj")
          ) ?? false
        );
      }

      if (filter === "Favorites") return !!bar.favorite;
      return true;
    })
    .filter(
      (bar) =>
        bar.name.toLowerCase().includes(search.toLowerCase()) ||
        bar.description.toLowerCase().includes(search.toLowerCase())
    )
    // Favorites on top
    .sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));

  const toggleFavorite = (id: string) => {
    const updated = bars.map((bar) =>
      bar.id === id ? { ...bar, favorite: !bar.favorite } : bar
    );
    setBars(updated);
  };

  // ---------- Render ----------
  const renderBar = ({ item }: { item: BarBase }) => {
    const firstDeal =
      item.dealsScheduled?.[0]?.title ??
      item.eventsScheduled?.[0]?.name ??
      "No specials tonight";

    const openNow = isBarOpen(item, now);

    return (
      <TouchableOpacity onPress={() => router.push(`/bars/${item.id}`)}>
        <View style={styles.barCard}>
          <Image source={item.logo} style={styles.barImage} resizeMode="cover" />
          <View style={styles.barInfo}>
            <Text style={styles.barName}>{item.name}</Text>
            <Text style={styles.barStatus}>
              {openNow ? `Open - Until ${item.closingTime ?? ""}` : "Closed"}
            </Text>
            <Text style={styles.barSpecials}>{firstDeal}</Text>
          </View>
          <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
            <FontAwesome
              name="star"
              size={22}
              color={item.favorite ? "#33CCFF" : "grey"}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // ---------- UI ----------
  return (
    <View style={styles.container}>
      {/* Search & Filters */}
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <FontAwesome
            name="search"
            size={18}
            color="#33CCFF"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search bars or keywords"
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.filters}>
          {["All", "Open Now", "Specials", "Live Music", "Favorites"].map(
            (option) => (
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
            )
          )}
        </View>
      </View>

      {/* Bar List */}
      <FlatList
        data={filteredBars}
        renderItem={renderBar}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.barList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b12",
  },
  searchFilterContainer: {
    backgroundColor: "#1A1A1A",
    paddingVertical: 12,
    paddingHorizontal: 14,
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
    color: "#94A3B8",
    fontSize: 14,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  filterButton: {
    backgroundColor: "#1A1A1A",
    borderColor: "#33CCFF",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginHorizontal: 6,
  },
  activeFilter: {
    backgroundColor: "#33CCFF",
  },
  filterText: {
    color: "white",
    fontSize: 13,
  },
  barList: {
    paddingBottom: 80,
  },
  barCard: {
    flexDirection: "row",
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
    alignItems: "center",
  },
  barImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  barInfo: {
    flex: 1,
  },
  barName: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  barStatus: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  barSpecials: {
    color: "white",
    fontSize: 14,
    marginVertical: 2,
  },
});
