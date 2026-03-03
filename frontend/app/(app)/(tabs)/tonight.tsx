// app/(tabs)/tonight.tsx
// High-level: This screen renders the "Tonight" tab with 3 views:
//  - Open Now (bars currently open)
//  - Deals Tonight (bars with an active scheduled deal)
//  - Friends near you
// Data comes from backend APIs and schedule utilities.

import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTonightData } from "@/hooks/useTonightData";
import { useFriends } from "@/hooks/useFriends";
import { useBars } from "@/hooks/useBars";
import { IMG } from "@/assets/assets";
import { getLogoAssetForLocationName } from "@/utils/locationLogos";
import { getNow, isActive, isBarOpen } from "@/utils/schedule";

import { Theme } from "@/constants/theme";
import type { Friend } from "@/types/types";

// Tabs
// Simple static metadata that drives the tab UI (key used in logic, label shown in UI)
const TAB_META = [
  { key: "open", label: "Open Now" },
  { key: "deals", label: "Deals Tonight" },
  { key: "friends", label: "Friends Near You" },
] as const;

// Derive a union type from TAB_META keys: "open" | "deals" | "friends"
type TabKey = (typeof TAB_META)[number]["key"];

const HERO_POSTERS = [
  {
    id: "outlaws-tuesday",
    barName: "Outlaws",
    image: IMG.DealOutlawsTuesday,
  },
  {
    id: "blue-owl-pool-tuesday",
    barName: "The Blue Owl Bar",
    image: IMG.DealBlueOwlPoolTuesday,
  },
  {
    id: "paddys-disney-trivia",
    barName: "Paddy's Irish Pub",
    image: IMG.DealPaddysDisneyTrivia,
  },
  {
    id: "cys-cherry-bombs",
    barName: "Cy's Roost",
    image: IMG.DealCysCherryBombs,
  },
] as const;

const CURRENT_USER_ID = 1;

export default function Tonight() {
  // Which tab the user is on
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  // Global search query (filters both bars and friends)
  const [query, setQuery] = useState("");

  // Fetch data from database using the custom hook
  const { barsWithTonightData, allActiveDealsTonight, loading, error } = useTonightData();
  const { bars: scheduledBars, loading: scheduledBarsLoading } = useBars();
  const {
    friends,
    loading: friendsLoading,
    error: friendsError,
  } = useFriends(CURRENT_USER_ID);

  const hasError = !!error || !!friendsError;
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
  // If the "Friends" tab is active, we search fetched friends by name/username.
  const filteredFriends = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data: Friend[] = friends;
    if (q) {
      data = data.filter(
        (f) =>
          (f.name ?? "").toLowerCase().includes(q) ||
          (f.username ?? "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [query, friends]);

  const tonightPosters = useMemo(() => {
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

    return HERO_POSTERS.map((poster) => {
      const posterKey = normalize(poster.barName);
      const matchedBar = scheduledBars.find((bar) => {
        const barKey = normalize(bar.name);
        return (
          barKey === posterKey ||
          barKey.includes(posterKey) ||
          posterKey.includes(barKey)
        );
      });

      return {
        id: poster.id,
        barId: matchedBar ? String(matchedBar.id) : null,
        image: poster.image,
      };
    });
  }, [scheduledBars]);

  const upcomingDealsData = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = getNow();
    const baseNight = new Date(now);
    baseNight.setHours(21, 0, 0, 0);

    const nextOpenNight = (() => {
      for (let offset = 1; offset <= 14; offset++) {
        const candidate = new Date(baseNight);
        candidate.setDate(baseNight.getDate() + offset);
        if (scheduledBars.some((bar) => isBarOpen(bar, candidate))) {
          return candidate;
        }
      }
      return null;
    })();

    if (!nextOpenNight) {
      return {
        label: "Upcoming Deals & Events",
        deals: [] as {
          id: string;
          barId: string;
          bar: string;
          title: string;
          subtitle: string;
        }[],
      };
    }

    const formatter = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    let deals = scheduledBars.flatMap((bar) => {
      if (!isBarOpen(bar, nextOpenNight)) return [];
      const activeDeals = (bar.dealsScheduled ?? []).filter((deal) =>
        isActive(deal.rule, nextOpenNight)
      );

      return activeDeals.map((deal) => ({
        id: `${bar.id}-${deal.id}`,
        barId: String(bar.id),
        bar: bar.name,
        title: deal.title,
        subtitle: deal.subtitle ?? "",
      }));
    });

    if (q) {
      deals = deals.filter(
        (item) =>
          item.bar.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q)
      );
    }

    return {
      label: `Upcoming Deals • ${formatter.format(nextOpenNight)}`,
      deals,
    };
  }, [query, scheduledBars]);

  // Navigation helpers
  const goToBarDetail = (id: string, backTo: "home" | "bars" = "bars") =>
    router.push({
      pathname: "/bars/[id]",
      params: { id, backTo },
    });

  const goToFriendsTab = () => router.navigate("/account/account");

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: 5, paddingBottom: 0 }]}
      edges={["left", "right"]}
    >
      {/* Loading state */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.dark.primary} />
          <Text style={styles.loadingText}>Loading tonight&apos;s events...</Text>
        </View>
      )}

      {/* Error state */}
      {hasError && !isLoading && (
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={Theme.dark.primary}
          />
          <Text style={styles.errorText}>Unable to load tonight&apos;s events</Text>
          <Text style={styles.errorSubtext}>Please try again later</Text>
        </View>
      )}

      {/* Main content */}
      {!isLoading && !hasError && (
        <ScrollView
          stickyHeaderIndices={[1]} // index 1 (the "Sticky Tabs + Search" view) will stick to the top while scrolling
          contentContainerStyle={{ paddingBottom: 1 }}
          contentInsetAdjustmentBehavior="never"
        >
          {/* Deals carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
            style={{ marginBottom: 12 }}
          >
            {tonightPosters.map((poster) => {
              // Guard so TS & runtime both know barId is present
              const barId = poster.barId;
              if (!barId) return null;

              return (
                <Pressable
                  key={poster.id}
                  onPress={() => goToBarDetail(barId, "home")}
                  style={{ borderRadius: 12 }}
                >
                  <Image
                    source={poster.image}
                    style={styles.heroImage}
                    resizeMode="cover"
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Sticky Tabs + Search (this whole block is sticky due to stickyHeaderIndices) */}
          <View style={styles.stickyTabs}>
            {/* <Text style={styles.sectionTitle}>Events Tonight</Text> */}

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

          {/* Content area switches between "friends list" and "bars list" */}
          {activeTab === null ? (
            <View style={styles.cardsList}>
              <Text style={styles.upcomingTitle}>{upcomingDealsData.label}</Text>
              {upcomingDealsData.deals.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.card, styles.cardDealsVariant]}
                  onPress={() => goToBarDetail(item.barId)}
                >
                  <Image
                    source={getLogoAssetForLocationName(item.bar)}
                    style={styles.cardImg}
                    resizeMode="cover"
                  />

                  <View style={{ flex: 1, justifyContent: "center" }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.bar}</Text>
                    {!!item.subtitle && (
                      <Text style={styles.cardDetail}>{item.subtitle}</Text>
                    )}
                    <View style={styles.dealChip}>
                      <Ionicons
                        name="pricetags-outline"
                        size={12}
                        color="#22d3ee"
                      />
                      <Text style={styles.dealChipText}>UPCOMING</Text>
                    </View>
                  </View>

                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Theme.search.inactiveInput}
                  />
                </Pressable>
              ))}

              {!upcomingDealsData.deals.length && (
                <Text style={styles.emptyText}>No upcoming deals or events found. Check back later!</Text>
              )}
            </View>
          ) : activeTab === "friends" ? (
            // -------- Friends View --------
            <View style={styles.friendsList}>
              {filteredFriends.map((f) => (
                <Pressable
                  key={String(f.id)}
                  onPress={goToFriendsTab} // For now, tapping a friend routes to the Friends tab
                  style={styles.friendTile}
                >
                  <Image
                    source={f.avatar || require("@/assets/images/Logo.png")}
                    style={styles.friendAvatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>
                      {f.name || f.username || "Friend"}
                    </Text>
                    <Text style={styles.friendBar}>{f.status || "Offline"}</Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Theme.search.inactiveInput}
                  />
                </Pressable>
              ))}
              {/* Empty-state message if no search results */}
              {!filteredFriends.length && (
                <Text style={styles.emptyText}>No nearby friends found.</Text>
              )}
            </View>
          ) : activeTab === "open" ? (
            // -------- Open Now View --------
            <View style={styles.cardsList}>
              {filteredBars.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() => goToBarDetail(item.id)}
                >
                  <Image
                    source={getLogoAssetForLocationName(item.bar)}
                    style={styles.cardImg}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.cardTitle}>{item.bar}</Text>
                    {!!item.event && (
                      <Text style={styles.cardSubtitle}>{item.event}</Text>
                    )}
                    {!!item.openHours && (
                      <Text style={styles.cardDetail}>Hours: {item.openHours}</Text>
                    )}
                    {!!item.specials && (
                      <Text style={styles.cardDetail}>{item.specials}</Text>
                    )}
                  </View>
                  <View style={styles.rightContainer}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: item.isOpen ? Theme.dark.success : "#6b7280" },
                      ]}
                    >
                      <Text style={styles.statusPillText}>
                        {item.isOpen ? "Open" : "Closed"}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Theme.search.inactiveInput} />
                  </View>
                </Pressable>
              ))}
              {!filteredBars.length && (
                <Text style={styles.emptyText}>No bars currently open.</Text>
              )}
            </View>
          ) : activeTab === "deals" ? (
            // -------- Deals View --------
            <View style={styles.cardsList}>
              {filteredDeals.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.card, styles.cardDealsVariant]}
                  onPress={() => goToBarDetail(item.barId)}
                >
                  <Image
                    source={getLogoAssetForLocationName(item.bar)}
                    style={styles.cardImg}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1, justifyContent: 'center' }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.bar}</Text>
                    {!!item.subtitle && (
                      <Text style={styles.cardDetail}>{item.subtitle}</Text>
                    )}
                  </View>
                  <View style={styles.rightContainer}>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: Theme.dark.primary },
                      ]}
                    >
                      <Text style={styles.statusPillText}>Deal</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Theme.search.inactiveInput} />
                  </View>
                </Pressable>
              ))}
              {!filteredDeals.length && (
                <Text style={styles.emptyText}>No deals available tonight.</Text>
              )}
            </View>
          ) : null}
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.dark.background,
    paddingHorizontal: 20,
  },
  errorText: {
    color: Theme.container.titleText,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  errorSubtext: {
    color: Theme.container.inactiveText,
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
  heroImage: {
    width: 300,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.container.mainBorder,
    backgroundColor: Theme.container.background,
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
  cardsList: { padding: 16, gap: 12, paddingBottom: 92 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: Theme.container.background, // "#0f172a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardDealsVariant: {
    borderColor: Theme.container.secondaryBorder, // "#164e63",
    backgroundColor: Theme.container.background, // "#0b1420"
  },
  cardImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.container.mainBorder, // "#1f2937",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cardTitle: {
    color: Theme.container.titleText, // "#f1f5f9",
    fontWeight: "800",
    fontSize: 14,
  },
  cardSubtitle: {
    color: Theme.container.inactiveText, // "#cbd5e1",
    marginTop: 2,
    fontSize: 13,
  },
  cardDetail: {
    color: Theme.container.inactiveText, // "#94a3b8",
    marginTop: 2,
    fontSize: 12,
  },
  dealChip: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#0b2530",
    borderWidth: 1,
    borderColor: "#155e75",
  },
  dealChipText: {
    color: "#22d3ee",
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.3,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusPillText: {
    color: "#0b0c12",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  friendsList: { 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    gap: 10 
  },
  friendTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: Theme.container.background, // "#0f172a",
    borderWidth: 1,
    borderColor: Theme.container.mainBorder, // "#1f2937",
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Theme.container.mainBorder, // "#1f2937",
  },
  friendName: {
    color: Theme.container.titleText, // "#f1f5f9",
    fontWeight: "700",
    fontSize: 14,
  },
  friendBar: {
    color: Theme.container.inactiveText, // "#93c5fd",
    fontWeight: "600",
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: Theme.container.inactiveText, // "#94a3b8",
    textAlign: "center",
    marginTop: 24,
    fontSize: 13,
  },
  upcomingTitle: {
    color: Theme.container.titleText,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  
});
