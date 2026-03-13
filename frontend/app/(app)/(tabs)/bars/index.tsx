import { FontAwesome } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { useBars } from "@/hooks/useBars";
import { shouldForceErrorPage } from "@/utils/dev-error-pages";
import ErrorState from "@/components/ui/error-state";
import type { Bar } from "@/types/bars";
import { IMG } from "../../../../assets/assets"; 

import { getBarImageSource } from "@/utils/bar-assets";

import { Theme } from '@/constants/theme';

export default function Bars() {
  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { bars, loading, error } = useBars({ q: search || undefined });

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

    // TODO - probs want to update the db once that works again
    const toggleFavorite = (id: string) => {
        setFav( (prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

  const isFav = (b: Bar) => fav[String(b.id)] ?? !!b.favorite;

  const hasError = !!error || shouldForceErrorPage("bars");

    const visibleBars = useMemo(() => {
        if (!bars) return [];

        const q = search.trim().toLowerCase();

        const filteredBars = bars
            .filter(b => {
              if (filter === "Bars" && b.location_type_id !== 1) {
                return false;
              }

              if (filter === "Restaurants" && b.location_type_id !== 2) {
                return false;
              }

              if (filter === "Favorites" && !isFav(b)) {
                    return false;
                }

                if (q) {
                    const inName = (b.name || '').toLowerCase().includes(q);
                    const inDesc = (b.description || '').toLowerCase().includes(q);
                    if (!inName && !inDesc) {
                        return false;
                    }
                }

                return true;
            });

        return filteredBars.sort((a, b) => Number(isFav(b)) - Number(isFav(a)));

    }, [bars, filter, search, fav]);


  const renderBar = ({ item }: { item: Bar & { __openNow?: boolean } }) => {
    const firstDeal =
      item.dealsScheduled?.[0]?.title ??
      item.eventsScheduled?.[0]?.name ??
      "No specials tonight";
    const openNow = !!item.__openNow;
    
    const imageSource = getBarImageSource(item);

    const id = String(item.id);
    const favOn = isFav(item);

    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(app)/(tabs)/bars/[id]",
            params: { id: String(item.id) },
          })
        }
      >

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
            <FontAwesome name="star" size={22} color={favOn ? Theme.dark.tertiary : Theme.container.inactiveText} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (hasError) {
    return (
      <View style={styles.container}>
        <ErrorState title="Unable to load bars" subtitle="Please try again later." />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchFilterContainer}>
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={18} color={Theme.search.inactiveInput} style={styles.searchIcon} />
          <TextInput
            placeholder="Search bars or keywords"
            placeholderTextColor={Theme.search.inactiveInput}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>
        <View style={styles.filters}>
          {["Bars", "Restaurants", "Favorites"].map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.filterButton, filter === option && styles.activeFilter]}
              onPress={() => setFilter(prev => (prev === option ? null : option))}
            >
              <Text style={[styles.filterText, filter === option && styles.filterTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 24 }} color={Theme.dark.primary} />
            ) : (
                visibleBars.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {filter === "Favorites"
                            ? "You don't have any favorite locations yet"
                            : "No locations match your filters"}
                        </Text>
                    </View>
                ) : (
                <FlatList
                    data={visibleBars}
                    renderItem={renderBar}
                    keyExtractor={item => String(item.id)}
                    contentContainerStyle={styles.barList}
                    showsVerticalScrollIndicator={false}
                />
              )
            )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
  },
  searchFilterContainer: {
    paddingVertical: 10,
  },
  searchBar: {
    marginHorizontal: 16,
    marginTop: 2,
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
  searchInput: {
    flex: 1,
    color: Theme.search.input,
    fontSize: 14,
    paddingVertical: 0
  },
  searchIcon: { marginRight: 8 },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
  },
  filterButton: {
    backgroundColor: "transparent",
    borderColor: Theme.container.inactiveBorder,
    borderWidth: 2,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  activeFilter: {
    borderColor: Theme.dark.primary,
  },
  filterText: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    fontWeight: "700",
  },
  filterTextActive: {
    color: Theme.container.activeText,
    fontWeight: "800",
  },
  barList: { paddingBottom: 80 },
  barCard: {
    flexDirection: "row",
    backgroundColor: Theme.container.background,
    borderRadius: 16,
    padding: 12,
    marginVertical: 6,
    alignItems: "center"
  },
  barImage: { width: 70, height: 70, borderRadius: 12, marginRight: 12 },
  barInfo: { flex: 1 },
  barName: {
    color: Theme.container.titleText,
    fontSize: 18,
    fontWeight: "600"
  },
  barStatus: {
    color: Theme.container.titleText,
    fontSize: 14,
    fontWeight: "500"
  },
  barSpecials: {
    color: Theme.container.titleText,
    fontSize: 14,
    marginVertical: 2
  },
  emptyContainer: {
      flex: 1,
      justifyContent: "center",
    },
    emptyText: {
      color: Theme.search.inactiveInput,
      fontSize: 13,
      textAlign: "center",
    },
});
