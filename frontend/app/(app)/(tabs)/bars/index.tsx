import React, { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, RefreshControl } from "react-native";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import { useBars } from "@/hooks/useBars";
import { shouldForceErrorPage } from "@/utils/dev-error-pages";
import ErrorState from "@/components/ui/error-state";
import { Theme } from '@/constants/theme';

import { BarCard, FilterTab } from "@/components/bars/bar-list-components";
import { Skeleton, } from "@/components/ui/skeleton";
import { useFavorites } from '@/context/FavoritesContext';
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

export default function Bars() {

  const router = useRouter();
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const { bars, loading, error, refetch } = useBars({ q: search || undefined });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refetch) {
        await refetch();
      }
    } catch (err) {
      console.error("Refresh failed:", err);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const navigation = useNavigation<BottomTabNavigationProp<any>>();

  useEffect(() => {

    const tabNavigation = navigation.getParent<BottomTabNavigationProp<any>>();

    if (tabNavigation) {
      const unsubscribe = tabNavigation.addListener('tabPress', (e) => {

        const isFocused = navigation.isFocused();

        if (isFocused) {
          console.log("Martini Icon Tapped - Resetting State");

          setSearch("");
          setFilter(null);

          if (refetch) {
            refetch();
          }
        }
      });

      return unsubscribe;
    }
  }, [navigation, refetch]);

  const { isFavorited, toggleFavorite } = useFavorites();

  const BarsSkeleton = () => (
    <View style={{ padding: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}>
          <Skeleton width={70} height={70} borderRadius={12} />
          <View style={{ marginLeft: 12, flex: 1, gap: 8 }}>
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={14} />
            <Skeleton width="80%" height={14} />
          </View>
        </View>
      ))}
    </View>
  );

  const visibleBars = useMemo(() => {
    if (!bars) return [];
    const q = search.trim().toLowerCase();

    return bars
      .filter(b => {

        const id = String(b.id);

        // Filter by Type
        if (filter === "Bars" && b.location_type_id !== 1) return false;
        if (filter === "Restaurants" && b.location_type_id !== 2) return false;

        // Filter by Favorites (using the Context function)
        if (filter === "Favorites" && !isFavorited(id)) return false;

        // Search logic
        if (q && !(b.name?.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q))) return false;

        return true;
      })
      .sort((a, b) => Number(isFavorited(b.id)) - Number(isFavorited(a.id)));

  }, [bars, filter, search, isFavorited]);

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
        <BarsSkeleton />
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.dark.primary}
              colors={[Theme.dark.primary]}
            />
          }
          renderItem={({ item }) => (
            <BarCard
              item={item}
              isFav={isFavorited(item.id)}
              onToggleFav={() => toggleFavorite(item.id)}
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