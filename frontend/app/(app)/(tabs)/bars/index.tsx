import { FontAwesome } from "@expo/vector-icons";
import React, { useMemo, useState, useEffect } from "react";
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  FlatList, TextInput, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { useBars } from "@/hooks/useBars";
import type { Bar } from "@/types/bars";
import { IMG } from "../../../../assets/assets"; 
import { getNow, isBarOpen } from "@/config/time";

import { Theme } from '@/constants/theme';

// Map bar names to cover images
const barCoverMap: { [key: string]: any } = {
  "AJ's Ultralounge": IMG.AJs,
  "BNC Fieldhouse": IMG.bnc,
  "Cy's Roost": IMG.CysRoost,
  "Welch Ave Station": IMG.Welch,
  "The Blue Owl Bar": IMG.BlueOwl,
  "Paddy's Irish Pub": IMG.Paddys,
  "Sips": IMG.Sips,
  "Mickey's Irish Pub": IMG.Mickey,
  "Outlaws": IMG.Outlaws,
};

export default function Bars() {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const wantsDeals = filter === "Specials";
  const wantsLive = filter === "Live Music";

  const { bars, loading } = useBars({
    hasDeals: wantsDeals || undefined,
    liveMusic: wantsLive || undefined,
    q: search || undefined,
  });

    const [now, setNow] = useState(getNow());

        useEffect(() => {
            const interval = setInterval(() => {
            setNow(getNow());
        }, 10000); // 10 seconds
        return () => clearInterval(interval);
    }, []);

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

    const visibleBars = useMemo(() => {
        if (!bars) return [];

        const q = search.trim().toLowerCase();

        const filteredBars = bars
            .map(bar => ({
                ...bar,
                // __openNow: isBarOpen(bar, now),
                __openNow: bar.open ?? false,
            }))
            .filter(b => {
                if (filter === "Open Now" && !b.__openNow) {
                    return false;
                }

                if (filter === "Favorites" && !isFav(b)) {
                    return false;
                }

                if (filter === "Specials" && (!b.dealsScheduled || b.dealsScheduled.length === 0) && (!b.eventsScheduled || b.eventsScheduled.length === 0)) {
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

    }, [bars, filter, search, fav, now]);


  const renderBar = ({ item }: { item: Bar & { __openNow?: boolean } }) => {
    const firstDeal =
      item.dealsScheduled?.[0]?.title ??
      item.eventsScheduled?.[0]?.name ??
      "No specials tonight";
    const openNow = !!item.__openNow;
    // Use mock cover images for now since backend doesn't have photos yet
    const imageSource = barCoverMap[item.name] || (item.logoUrl ? { uri: item.logoUrl } : item.logo);
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
          {["All", "Open Now", "Specials", "Favorites"].map(option => (
            <TouchableOpacity
              key={option}
              style={[styles.filterButton, filter === option && styles.activeFilter]}
              onPress={() => setFilter(option)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === option && { color: Theme.container.activeText, fontWeight: "600" },
                ]}
              >
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
                            {filter === "Open Now"
                            ? "No bars are open right now"
                            : filter === "Favorites"
                            ? "You don't have any favorite bars yet"
                            : "No bars match your filters"}
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
  },
  filterButton: {
    backgroundColor: Theme.container.background,
    borderColor: Theme.dark.primary,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginHorizontal: 6
  },
  activeFilter: {
    backgroundColor: Theme.dark.primary,
  },
  filterText: {
    color: Theme.container.titleText,
    fontSize: 13
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
