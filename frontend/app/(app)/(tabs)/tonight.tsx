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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { useTonightData } from "@/hooks/useTonightData";
// import { useFriends } from "@/hooks/useFriends";
import { useBars } from "@/hooks/useBars";
import { IMG } from "@/assets/assets";
import { getLogoAssetForLocationName } from "@/utils/locationLogos";
import { shouldForceErrorPage } from "@/utils/dev-error-pages";
import ErrorState from "@/components/ui/error-state";
import { getNow, isActive, isBarOpen } from "@/utils/schedule";

import { Theme } from "@/constants/theme";
// import type { Friend } from "@/types/types";

// Tabs
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

type UpcomingWeekItem = {
  id: string;
  barId: string;
  bar: string;
  title: string;
  subtitle: string;
  kind: "Deal" | "Event";
  startsAt: Date;
  whenLabel: string;
};

type UpcomingWeekGroup = {
  key: string;
  label: string;
  items: UpcomingWeekItem[];
};

function formatUpcomingDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

// const CURRENT_USER_ID = 1;

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
  // Temporary for user testing:
  // const {
  //   friends,
  //   loading: friendsLoading,
  //   error: friendsError,
  // } = useFriends(CURRENT_USER_ID);
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

  const upcomingWeekData = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = getNow();
    const windowEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const stepMs = 5 * 60 * 1000;

    const items: UpcomingWeekItem[] = [];

    const pushOneTimeItem = (
      base: Omit<UpcomingWeekItem, "startsAt" | "whenLabel">,
      start: string,
      end: string
    ) => {
      const startsAt = new Date(start);
      const endsAt = new Date(end);
      if (Number.isNaN(startsAt.getTime())) return;
      if (Number.isNaN(endsAt.getTime())) return;
      if (endsAt < now || startsAt > windowEnd) return;

      const isHappeningNow = startsAt <= now && endsAt >= now;
      const displayTime = isHappeningNow ? now : startsAt;

      items.push({
        ...base,
        id: `${base.id}-${displayTime.getTime()}`,
        startsAt: displayTime,
        whenLabel: isHappeningNow ? "Happening now" : formatUpcomingDateTime(startsAt),
      });
    };

    const pushWeeklyItems = (
      base: Omit<UpcomingWeekItem, "startsAt" | "whenLabel">,
      rule: { kind: "weekly"; tz: string; daysOfWeek: number[]; startLocalTime: string; endLocalTime: string }
    ) => {
      let wasActive = isActive(rule, now);

      if (wasActive) {
        items.push({
          ...base,
          id: `${base.id}-active-${now.getTime()}`,
          startsAt: now,
          whenLabel: "Happening now",
        });
      }

      for (let cursorMs = now.getTime() + stepMs; cursorMs <= windowEnd.getTime(); cursorMs += stepMs) {
        const cursor = new Date(cursorMs);
        const isCurrentlyActive = isActive(rule, cursor);

        if (!wasActive && isCurrentlyActive) {
          items.push({
            ...base,
            id: `${base.id}-${cursor.getTime()}`,
            startsAt: cursor,
            whenLabel: formatUpcomingDateTime(cursor),
          });
        }

        wasActive = isCurrentlyActive;
      }
    };

    scheduledBars.forEach((bar) => {
      const barId = String(bar.id);

      (bar.dealsScheduled ?? []).forEach((deal) => {
        const base = {
          id: `deal-${barId}-${deal.id}`,
          barId,
          bar: bar.name,
          title: deal.title,
          subtitle: deal.subtitle ?? "",
          kind: "Deal" as const,
        };

        if (deal.rule.kind === "one-time") {
          pushOneTimeItem(base, deal.rule.start, deal.rule.end);
          return;
        }

        pushWeeklyItems(base, deal.rule);
      });

      (bar.eventsScheduled ?? []).forEach((event) => {
        const subtitle =
          event.description && event.description !== event.name
            ? event.description
            : "";

        const base = {
          id: `event-${barId}-${event.id}`,
          barId,
          bar: bar.name,
          title: event.name,
          subtitle,
          kind: "Event" as const,
        };

        if (event.rule.kind === "one-time") {
          pushOneTimeItem(base, event.rule.start, event.rule.end);
          return;
        }

        pushWeeklyItems(base, event.rule);
      });
    });

    let upcomingItems = items.sort(
      (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
    );

    if (q) {
      upcomingItems = upcomingItems.filter((item) =>
        [item.bar, item.title, item.subtitle, item.kind]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    const labelFormatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    });

    const groupLabelFormatter = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const groupsMap = new Map<string, UpcomingWeekItem[]>();
    upcomingItems.forEach((item) => {
      const groupDate = new Date(item.startsAt);
      groupDate.setHours(0, 0, 0, 0);
      const key = `${groupDate.getFullYear()}-${groupDate.getMonth()}-${groupDate.getDate()}`;

      const existing = groupsMap.get(key) ?? [];
      existing.push(item);
      groupsMap.set(key, existing);
    });

    const groups: UpcomingWeekGroup[] = Array.from(groupsMap.entries()).map(
      ([key, groupedItems]) => {
        const groupDate = new Date(groupedItems[0].startsAt);
        groupDate.setHours(0, 0, 0, 0);

        const dayDiff = Math.round(
          (groupDate.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000)
        );

        let groupLabel = groupLabelFormatter.format(groupDate);
        if (dayDiff === 0) groupLabel = "Today";
        if (dayDiff === 1) groupLabel = "Tomorrow";

        return {
          key,
          label: groupLabel,
          items: groupedItems,
        };
      }
    );

    return {
      label: `Upcoming This Week • ${labelFormatter.format(now)} - ${labelFormatter.format(windowEnd)}`,
      items: upcomingItems,
      groups,
    };
  }, [query, scheduledBars]);

  // Navigation helpers
  const goToBarDetail = (id: string, backTo: BackTarget = "bars") =>
    router.push({
      pathname: "/bars/[id]",
      params: { id, backTo },
    });

  // const goToFriendsTab = () => router.navigate("/account/account");

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
        <ErrorState title="Unable to load tonight's events" />
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
              <Text style={styles.upcomingTitle}>{upcomingWeekData.label}</Text>
              {upcomingWeekData.groups.map((group) => (
                <View key={group.key} style={styles.upcomingGroup}>
                  <Text style={styles.upcomingDayHeader}>{group.label}</Text>

                  {group.items.map((item) => (
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
                        <Text style={styles.cardDetail}>{item.whenLabel}</Text>
                        {!!item.subtitle && (
                          <Text style={styles.cardDetail}>{item.subtitle}</Text>
                        )}
                      </View>

                      <View style={styles.rightContainer}>
                        <View
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor:
                                item.kind === "Deal"
                                  ? Theme.dark.primary
                                  : Theme.dark.secondary,
                            },
                          ]}
                        >
                          <Text style={styles.statusPillText}>{item.kind}</Text>
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={18}
                          color={Theme.search.inactiveInput}
                        />
                      </View>
                    </Pressable>
                  ))}
                </View>
              ))}

              {!upcomingWeekData.items.length && (
                <Text style={styles.emptyText}>No upcoming deals or events found. Check back later!</Text>
              )}
            </View>
          ) : activeTab === "friends" ? (
            // -------- Friends View --------
            <View style={styles.friendsList}>
              {/* Temporarily disabled for user testing until tracking data is implemented.
              {filteredFriends.map((f) => (
                <Pressable
                  key={String(f.id)}
                  onPress={goToFriendsTab}
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
              {!filteredFriends.length && (
                <Text style={styles.emptyText}>No nearby friends found.</Text>
              )}
              */}
              <Text style={styles.emptyText}>Friend tracking coming soon!</Text>
            </View>
          ) : activeTab === "open" ? (
            // -------- Open Now View --------
            <View style={styles.cardsList}>
              {filteredBars.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() => goToBarDetail(item.id, "tonight-open")}
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
                  onPress={() => goToBarDetail(item.barId, "tonight-deals")}
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
  cardsList: { 
    padding: 16, 
    gap: 12, 
    paddingBottom: 92 
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: Theme.container.background, // "#0f172a",
    borderRadius: 14,
    borderWidth: 1,
    // borderColor: "#1f2937",
    borderColor: Theme.container.secondaryBorder,
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
    // borderColor: Theme.container.mainBorder, // "#1f2937",
    borderColor: Theme.container.secondaryBorder,
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
  statusPill: {
    width: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  statusPillText: {
    color: "#0b0c12",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
    textAlign: "center",
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
    // borderColor: Theme.container.mainBorder, // "#1f2937",
    borderColor: Theme.container.secondaryBorder,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 10, // 999,
    borderWidth: 1,
    // borderColor: Theme.container.mainBorder, // "#1f2937",
    borderColor: Theme.container.secondaryBorder,
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
  upcomingGroup: {
    gap: 12,
  },
  upcomingDayHeader: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  
});