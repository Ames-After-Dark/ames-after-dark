import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import { useBars } from "@/hooks/useBars";
import { shouldForceErrorPage } from "@/utils/dev-error-pages";
import ErrorState from "@/components/ui/error-state";
import { Theme } from '@/constants/theme';

import { BarCard, FilterTab } from "@/components/bars/bar-list-components";

export default function Bars() {
  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { bars, loading, error } = useBars({ q: search || undefined });
  const [fav, setFav] = useState<Record<string, boolean>>({});

  const barIdsSig = useMemo(() => (bars?.length ? bars.map(b => String(b.id)).join(",") : ""), [bars]);

  useEffect(() => {
    if (!barIdsSig) return;
    setFav(prev => {
      const next = { ...prev };
      let changed = false;
      bars?.forEach(b => {
        const id = String(b.id);
        if (!(id in next)) {
          next[id] = !!b.favorite;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [barIdsSig]);

  const toggleFavorite = (id: string) => setFav(prev => ({ ...prev, [id]: !prev[id] }));
  const isFav = (id: string, backendFav: boolean) => fav[id] ?? backendFav;

  const visibleBars = useMemo(() => {
    if (!bars) return [];
    const q = search.trim().toLowerCase();

    return bars
      .filter(b => {
        const id = String(b.id);
        if (filter === "Bars" && b.location_type_id !== 1) return false;
        if (filter === "Restaurants" && b.location_type_id !== 2) return false;
        if (filter === "Favorites" && !isFav(id, !!b.favorite)) return false;
        if (q && !(b.name?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => Number(isFav(String(b.id), !!b.favorite)) - Number(isFav(String(a.id), !!a.favorite)));
  }, [bars, filter, search, fav]);

  if (!!error || shouldForceErrorPage("bars")) {
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
          <FontAwesome name="search" size={18} color={Theme.search.inactiveInput} />
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
            <FilterTab
              key={option}
              label={option}
              isActive={filter === option}
              onPress={() => setFilter(prev => (prev === option ? null : option))}
            />
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} color={Theme.dark.primary} />
      ) : visibleBars.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {filter === "Favorites" ? "You don't have any favorite locations yet" : "No locations match your filters"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleBars}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.barList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <BarCard
              item={item}
              isFav={isFav(String(item.id), !!item.favorite)}
              onToggleFav={toggleFavorite}
              onPress={(id) => router.push({ pathname: "/(app)/(tabs)/bars/[id]", params: { id } })}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background
  },
  searchFilterContainer: {
    paddingVertical: 10
  },
  searchBar: {
    marginHorizontal: 16,
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
    fontSize: 14
  },
  filters: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16
  },
  barList: {
    paddingBottom: 80,
    paddingHorizontal: 16
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center"
  },
  emptyText: {
    color: Theme.search.inactiveInput,
    fontSize: 13,
    textAlign: "center"
  },
});