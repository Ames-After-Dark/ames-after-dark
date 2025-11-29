// app/(tabs)/tonight.tsx
// High-level: This screen renders the "Tonight" tab with 3 views:
//  - Open Now (bars currently open)
//  - Deals Tonight (bars with an active scheduled deal)
//  - Friends near you (mock list of friends + where they are)
// Data comes from local mock sources and time utilities to decide "open"/"active".

import React, { useMemo, useState } from "react";
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
import { router } from "expo-router";

import { BARS_BASE, FRIENDS, TONIGHT_POSTERS, BarId } from "@/data/mock";
import { getNow, isActive, isBarOpen } from "@/config/time";

import { Theme } from '@/constants/theme';

// Tabs
// Simple static metadata that drives the tab UI (key used in logic, label shown in UI)
const TAB_META = [
  { key: "open", label: "Open Now" },
  { key: "deals", label: "Deals Tonight" },
  { key: "friends", label: "Friends Near You" },
] as const;

// Derive a union type from TAB_META keys: "open" | "deals" | "friends"
type TabKey = typeof TAB_META[number]["key"];

export default function Tonight() {
  // Which tab the user is on
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  // Global search query (filters both bars and friends)
  const [query, setQuery] = useState("");
  // "Now" is abstracted here so we can fake time in development via getNow()
  const now = getNow();

  // ----- Compute “active” and “hasDeal” dynamically -----
  // We start from base bar data and compute per-bar values for *this moment*:
  // - event: the first currently active event name (fallback to first scheduled)
  // - specials: the first currently active deal title (if any)
  // - isOpen: based on each bar's hours and "now"
  // - hasDeal: whether there is at least 1 active deal right now
  const barsWithTonightData = useMemo(() => {
    return BARS_BASE.map((b) => {
      // Filter deals that are active *right now*
      const activeDeals =
        b.dealsScheduled?.filter((d) => isActive(d.rule, now)) ?? [];
      // Filter events that are active *right now*
      const activeEvents =
        b.eventsScheduled?.filter((e) => isActive(e.rule, now)) ?? [];

      return {
        id: b.id,
        bar: b.name,
        // Prefer an event that's active right now; otherwise preview the first scheduled one
        event: activeEvents[0]?.name ?? b.eventsScheduled?.[0]?.name ?? "",
        // Prefer a currently active deal title
        specials: activeDeals[0]?.title ?? "",
        // Compute open/closed from hours
        isOpen: isBarOpen(b, now),
        // Flag whether any deal is active
        hasDeal: activeDeals.length > 0,
        // Local image handle (logo) to render in cards
        image: b.logo,
      };
    });
    // Recompute only when "now" changes (e.g., dev fake time switch)
  }, [now]);

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
          d.bar.toLowerCase().includes(q) ||
          d.event.toLowerCase().includes(q) ||
          (d.specials ?? "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [activeTab, query, barsWithTonightData]);

  // ----- Filter friends -----
  // If the "Friends" tab is active, we search FRIENDS by name or bar.
  const filteredFriends = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = FRIENDS;
    if (q) {
      data = data.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.bar.toLowerCase().includes(q)
      );
    }
    return data;
  }, [query]);

  // Navigation helpers for row chevrons
  const goToBarsTab = () => router.navigate("/bars/index");
  const goToFriendsTab = () => router.navigate("/friends/friends");

  return (
  <SafeAreaView style={[styles.container, { paddingTop: 5, paddingBottom: 0 }]} edges={["left", "right"]}>
      {/* Outer scroll so we can have a header carousel + sticky controls + list */}
      <ScrollView
        stickyHeaderIndices={[1]} // index 1 (the "Sticky Tabs + Search" view) will stick to the top while scrolling
        contentContainerStyle={{ paddingBottom: 1 }}
        contentInsetAdjustmentBehavior="never"
      >
        {/* Deals carousel (currently placeholder images).
            Horizontal scroll shows promotional cards. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
          style={{ marginBottom: 12 }}
        >
          {TONIGHT_POSTERS.map((poster) => (
            <Image
              key={poster.id}
              source={poster.image}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ))}
        </ScrollView>


        {/* Sticky Tabs + Search (this whole block is sticky due to stickyHeaderIndices) */}
        <View style={styles.stickyTabs}>
          <Text style={styles.sectionTitle}>Events Tonight</Text>

          {/* Tab row: renders from TAB_META and toggles activeTab */}
          <View style={styles.tabsRow}>
            {TAB_META.map((t) => {
              const active = activeTab === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setActiveTab(t.key)}
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
            <Ionicons name="search" size={16} color={Theme.search.inactiveInput} />
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
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Content area switches between "friends list" and "bars list" */}
        {activeTab === "friends" ? (
          // -------- Friends View --------
          <View style={styles.friendsList}>
            {filteredFriends.map((f) => (
              <Pressable
                key={f.id}
                onPress={goToFriendsTab} // For now, tapping a friend routes to the Friends tab
                style={styles.friendTile}
              >
                <Image source={f.avatar!} style={styles.friendAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>{f.name}</Text>
                  <Text style={styles.friendBar}>{f.bar}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Theme.search.inactiveInput} />
              </Pressable>
            ))}
            {/* Empty-state message if no search results */}
            {!filteredFriends.length && (
              <Text style={styles.emptyText}>No nearby friends found.</Text>
            )}
          </View>
        ) : (
          // -------- Bars/Deals View --------
          <View style={styles.cardsList}>
            {filteredBars.map((item) => {
              // If we’re on "deals", emphasize the deal/event rather than the bar
              const isDealsView = activeTab === "deals";
              const headerText = isDealsView
                ? item.specials || item.event
                : item.bar;
              const subtitleText = isDealsView ? item.bar : item.event;
              const detailText = isDealsView
                ? item.event
                : item.specials ?? "";

              return (
                <View
                  key={item.id}
                  style={[styles.card, isDealsView && styles.cardDealsVariant]}
                >
                  {/* Left: bar logo (or any image) */}
                  <Image
                    source={item.image}
                    style={styles.cardImg}
                    resizeMode="cover"
                  />
                  {/* Middle: title, subtitle, details, and optionally pills */}
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{headerText}</Text>
                      {/* On "Open Now" tab, show an Open/Closed pill */}
                      {activeTab === "open" && (
                        <View
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor: item.isOpen
                                ? Theme.dark.success // "#22c55e" // green
                                : "#6b7280", // gray
                            },
                          ]}
                        >
                          <Text style={styles.statusPillText}>
                            {item.isOpen ? "Open" : "Closed"}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardSubtitle}>{subtitleText}</Text>
                    {!!detailText && (
                      <Text style={styles.cardDetail}>{detailText}</Text>
                    )}
                    {/* On "Deals" tab, also show a small "DEAL" chip */}
                    {isDealsView && (
                      <View style={styles.dealChip}>
                        <Ionicons
                          name="pricetags-outline"
                          size={12}
                          color="#22d3ee"
                        />
                        <Text style={styles.dealChipText}>DEAL</Text>
                      </View>
                    )}
                  </View>
                  {/* Right chevron navigating to Bars tab (detail view TBD) */}
                  <Pressable onPress={goToBarsTab} hitSlop={8}>
                    <Ionicons name="chevron-forward" size={18} color={Theme.search.inactiveInput} />
                  </Pressable>
                </View>
              );
            })}
            {/* Empty-state for bar/deals search results */}
            {!filteredBars.length && (
              <Text style={styles.emptyText}>No results for tonight.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// -------- Styles --------
// Colors are mostly dark mode with subtle borders and neon-ish accents.
// A few variants (e.g., cardDealsVariant) tweak tone for the Deals view.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background, // "#0B0C12"
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
    borderColor: Theme.dark.primary // "#38bdf8"
  },
  tabText: {
    color: Theme.container.inactiveText, // "#cbd5e1",
    fontSize: 12,
    fontWeight: "700"
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
    paddingVertical: 0
  },
  cardsList: { padding: 16, gap: 12, paddingBottom: 92, },
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
    backgroundColor: Theme.container.background // "#0b1420",
  },
  cardImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.container.mainBorder, // "#1f2937",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: {
    color: Theme.container.titleText, // "#f1f5f9",
    fontWeight: "800",
    fontSize: 14
  },
  cardSubtitle: {
    color: Theme.container.inactiveText, // "#cbd5e1",
    marginTop: 2,
    fontSize: 13
  },
  cardDetail: {
    color: Theme.container.inactiveText, // "#94a3b8",
    marginTop: 2,
    fontSize: 12
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
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusPillText: {
    color: "#0b0c12",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  friendsList: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
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
    fontSize: 14
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
});
