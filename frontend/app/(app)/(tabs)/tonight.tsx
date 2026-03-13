// app/(tabs)/tonight.tsx
// High-level: This screen renders the "Tonight" tab with 3 views:
//  - Open Now (bars currently open)
//  - Deals Tonight (bars with an active scheduled deal)
//  - Friends near you
// Data comes from backend APIs and schedule utilities.

import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { useTonightData } from "@/hooks/useTonightData";
// import { useFriends } from "@/hooks/useFriends";
import { useBars } from "@/hooks/useBars";

import { shouldForceErrorPage } from "@/utils/dev-error-pages";
import ErrorState from "@/components/ui/error-state";

import { Theme } from "@/constants/theme";
// import type { Friend } from "@/types/types";

import OpenNowSection from "@/components/tonight/open-now-sections";
import UpcomingSection from "@/components/tonight/upcomming-section";
import FriendsSection from "@/components/tonight/friends-section";
import DealsSection from "@/components/tonight/deals-section";
import TonightHero from "@/components/tonight/hero-carousel";
import { TonightSkeleton } from "@/components/tonight/tonight-skeleton";

import { useUpcomingSchedule } from "@/hooks/use-upcoming-data";

// Simple static metadata that drives the tab UI (key used in logic, label shown in UI)
const TAB_META = [
  { key: "open", label: "Open Now" },
  { key: "deals", label: "Deals Tonight" },
  { key: "friends", label: "Friends Near You" },
] as const;

// Derive a union type from TAB_META keys: "open" | "deals" | "friends"
type TabKey = (typeof TAB_META)[number]["key"];
type BackTarget = "home" | "bars" | "map" | "tonight-open" | "tonight-deals";

const isTabKey = (value: string | undefined): value is TabKey =>
  value === "open" || value === "deals" || value === "friends";

export default function Tonight() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  // Which tab the user is on
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  // Global search query (filters both bars and friends)
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isTabKey(tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

  // Fetch data from database using the custom hook
  const { barsWithTonightData, allActiveDealsTonight, loading, error } = useTonightData();
  const { bars: scheduledBars, loading: scheduledBarsLoading } = useBars();

  const friendsLoading = false;
  const friendsError = null;

  const hasError = !!error || !!friendsError || shouldForceErrorPage("tonight");
  const isLoading = loading || friendsLoading || scheduledBarsLoading;

  // ----- Filter for active tab -----
  // Take the computed list and filter based on the selected tab + text query.
  const filteredBars = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = barsWithTonightData;

    // "Open Now" tab => only show bars that are currently open
    if (activeTab === "open") data = data.filter((d) => d.isOpen);
    // "Deals" tab => only bars with an active deal
    if (activeTab === "deals") data = data.filter((d) => d.hasDeal);

    // Text search across bar name, event name, and specials text
    if (q) {
      data = data.filter(
        (d) =>
          (d.bar || "").toLowerCase().includes(q) ||
          (d.event || "").toLowerCase().includes(q) ||
          (d.specials ?? "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [activeTab, query, barsWithTonightData]);

  // ----- Filter deals for "Deals Tonight" tab -----
  const filteredDeals = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = allActiveDealsTonight || [];

    if (q) {
      data = data.filter(
        (d) =>
          d.bar.toLowerCase().includes(q) ||
          d.title.toLowerCase().includes(q) ||
          (d.subtitle ?? "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [query, allActiveDealsTonight]);

  // ----- Filter friends -----
  // Temporarily disabled for user testing until friend tracking is implemented.
  // const filteredFriends = useMemo(() => {
  //   const q = query.trim().toLowerCase();
  //   let data: Friend[] = friends;
  //   if (q) {
  //     data = data.filter(
  //       (f) =>
  //         (f.name ?? "").toLowerCase().includes(q) ||
  //         (f.username ?? "").toLowerCase().includes(q)
  //     );
  //   }
  //   return data;
  // }, [query, friends]);

  // const tonightPosters = useMemo(() => {
  //   const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

  //   return HERO_POSTERS.map((poster) => {
  //     const posterKey = normalize(poster.barName);
  //     const matchedBar = scheduledBars.find((bar) => {
  //       const barKey = normalize(bar.name);
  //       return (
  //         barKey === posterKey ||
  //         barKey.includes(posterKey) ||
  //         posterKey.includes(barKey)
  //       );
  //     });

  //     return {
  //       id: poster.id,
  //       barId: matchedBar ? String(matchedBar.id) : null,
  //       image: poster.image,
  //     };
  //   });
  // }, [scheduledBars]);

  const upcomingWeekData = useUpcomingSchedule(scheduledBars, query);

  // Navigation helpers
  const goToBarDetail = (id: string, backTo: BackTarget = "bars") =>
    router.push({
      pathname: "/bars/[id]",
      params: { id, backTo },
    });

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: 5, paddingBottom: 0 }]}
      edges={["left", "right"]}
    >
      {/* Loading state */}
      {isLoading && (
        // <View style={styles.loadingContainer}>
        //   <ActivityIndicator size="large" color={Theme.dark.primary} />
        //   <Text style={styles.loadingText}>Loading tonight&apos;s events...</Text>
        // </View>
        <TonightSkeleton />
      )}

      {/* Error state */}
      {hasError && !isLoading && (
        <ErrorState title="Unable to load tonight's events" />
      )}

      {/* Main content */}
      {!isLoading && !hasError && (
        <ScrollView
          stickyHeaderIndices={[1]} // index 1 (the "Sticky Tabs + Search" view) will stick to the top while scrolling
          contentContainerStyle={{ paddingBottom: 1 }}
          contentInsetAdjustmentBehavior="never"
        >
          {/* HERO deals carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
            style={{ marginBottom: 12 }}
          >
            <View style={styles.carouselWrapper}>
              <TonightHero
                scheduledBars={scheduledBars}
                onPosterPress={goToBarDetail}
              />
            </View>
          </ScrollView>

          {/* Sticky Tabs + Search (this whole block is sticky due to stickyHeaderIndices) */}
          <View style={styles.stickyTabs}>

            {/* Tab row: renders from TAB_META and toggles activeTab */}
            <View style={styles.tabsRow}>
              {TAB_META.map((t) => {
                const active = activeTab === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() =>
                      setActiveTab((prev) => (prev === t.key ? null : t.key))
                    }
                    style={[styles.tabBtn, active && styles.tabBtnActive]}
                  >
                    <Text
                      style={[styles.tabText, active && styles.tabTextActive]}
                      numberOfLines={1}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Search box filters either bars or friends depending on the tab */}
            <View style={styles.searchBox}>
              <Ionicons
                name="search"
                size={16}
                color={Theme.search.inactiveInput}
              />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search"
                placeholderTextColor={Theme.search.inactiveInput}
                style={styles.searchInput}
                returnKeyType="search"
              />
              {!!query && (
                <Pressable onPress={() => setQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color="#9CA3AF"
                  />
                </Pressable>
              )}
            </View>
          </View>

          {/* Content area switches between: 
                "open now" 
                "deals" 
                "friends near you"
                "active deals and events ('null')" 
          */}
          {/* Content area logic */}
          {activeTab === null && (
            <UpcomingSection data={upcomingWeekData} onBarPress={goToBarDetail} />
          )}

          {activeTab === "open" && (
            <OpenNowSection data={filteredBars} onBarPress={(id) => goToBarDetail(id, "tonight-open")} />
          )}

          {activeTab === "deals" && (
            <DealsSection data={filteredDeals} onBarPress={(id) => goToBarDetail(id, "tonight-deals")} />
          )}

          {activeTab === "friends" && (
            <FriendsSection />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background, // "#0B0C12"
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.dark.background,
  },
  loadingText: {
    color: Theme.container.inactiveText,
    marginTop: 12,
    fontSize: 14,
  },
  stickyTabs: {
    backgroundColor: Theme.dark.background, // "#0B0C12",
    paddingTop: 6,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: Theme.container.titleText, // "#E5E7EB",
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: Theme.container.inactiveBorder, // "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    borderColor: Theme.dark.primary, // "#38bdf8"
  },
  tabText: {
    color: Theme.container.inactiveText, // "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: Theme.container.activeText, // "#e0f2fe"
  },
  searchBox: {
    marginHorizontal: 16,
    marginTop: 2,
    backgroundColor: Theme.search.background, // "#111827",
    borderColor: Theme.search.border, // "#1f2937",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Theme.search.input, // "#E5E7EB",
    fontSize: 14,
    paddingVertical: 0,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: Theme.container.background, // "#0f172a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
  },
  carouselWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});