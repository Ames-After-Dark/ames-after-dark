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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';

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
import { useTopHeaderVisibility } from '@/context/top-header-visibility';

// Simple static metadata that drives the tab UI (key used in logic, label shown in UI)
const TAB_META = [
  { key: "open", label: "Open Now" },
  { key: "deals", label: "Deals Tonight" },
  { key: "friends", label: "Friends Near You" },
] as const;

// Derive a union type from TAB_META keys: "open" | "deals" | "friends"
type TabKey = (typeof TAB_META)[number]["key"];
type BackTarget = "home" | "bars" | "map" | "tonight-open" | "tonight-deals" | "tonight-friends";

const isTabKey = (value: string | undefined): value is TabKey =>
  value === "open" || value === "deals" || value === "friends";

const TOP_FORCE_SHOW_PX = 20;
const BOTTOM_DEAD_ZONE_PX = 24;
const HIDE_SCROLL_THRESHOLD_PX = 28;
const SHOW_SCROLL_THRESHOLD_PX = 20;

export default function Tonight() {

  const insets = useSafeAreaInsets();
  // const HEADER_HEIGHT = 60 + insets.top;

  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const { setTopHeaderVisible } = useTopHeaderVisibility();
  const lastScrollYRef = React.useRef(0);
  const dragStartYRef = React.useRef(0);
  const headerVisibleRef = React.useRef(true);
  const viewportHeightRef = React.useRef(0);
  const contentHeightRef = React.useRef(0);

  // Which tab the user is on
  const [activeTab, setActiveTab] = useState<TabKey | null>(null);
  // Global search query (filters both bars and friends)
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (isTabKey(tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

  useFocusEffect(
    React.useCallback(() => {
      headerVisibleRef.current = true;
      setTopHeaderVisible(true);
      dragStartYRef.current = 0;
      return () => {
        headerVisibleRef.current = true;
        setTopHeaderVisible(true);
        dragStartYRef.current = 0;
      };
    }, [setTopHeaderVisible])
  );

  const setHeaderVisibility = React.useCallback(
    (nextVisible: boolean) => {
      if (headerVisibleRef.current === nextVisible) {
        return;
      }

      headerVisibleRef.current = nextVisible;
      setTopHeaderVisible(nextVisible);
    },
    [setTopHeaderVisible]
  );

  const decideHeaderVisibilityAtRest = React.useCallback(
    (endYRaw: number) => {
      const maxY = Math.max(0, contentHeightRef.current - viewportHeightRef.current);
      const endY = Math.max(0, Math.min(endYRaw, maxY));
      const dragDelta = endY - dragStartYRef.current;

      if (endY <= TOP_FORCE_SHOW_PX) {
        setHeaderVisibility(true);
        return;
      }

      if (maxY > 0 && endY >= maxY - BOTTOM_DEAD_ZONE_PX) {
        setHeaderVisibility(false);
        return;
      }

      if (dragDelta >= HIDE_SCROLL_THRESHOLD_PX && endY > 72) {
        setHeaderVisibility(false);
      } else if (dragDelta <= -SHOW_SCROLL_THRESHOLD_PX) {
        setHeaderVisibility(true);
      }
    },
    [setHeaderVisibility]
  );

  const handleVerticalScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const delta = y - lastScrollYRef.current;

      // 1. Force show when near the very top of the list
      if (y <= 10) {
        setHeaderVisibility(true);
      }
      // 2. Hide header when scrolling down (positive delta) 
      // We add a small buffer (y > 50) so it doesn't hide immediately at the start
      else if (delta > 10 && y > 50) {
        setHeaderVisibility(false);
      }
      // 3. Show header when scrolling up (negative delta)
      else if (delta < -20) {
        setHeaderVisibility(true);
      }

      lastScrollYRef.current = y;
    },
    [setHeaderVisibility]
  );

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

  const activeSummary = useMemo(() => {
    if (activeTab === "open") {
      const count = filteredBars.length;
      return {
        icon: "time-outline" as const,
        title: "Open Now",
        subtitle: `${count} bar${count === 1 ? "" : "s"} currently open`,
      };
    }

    if (activeTab === "deals") {
      const count = filteredDeals.length;
      return {
        icon: "pricetag-outline" as const,
        title: "Deals Tonight",
        subtitle: `${count} active deal${count === 1 ? "" : "s"} tonight`,
      };
    }

    return null;
  }, [activeTab, filteredBars.length, filteredDeals.length, query]);

  const upcomingWeekData = useUpcomingSchedule(scheduledBars, query);

  const homeSummary = useMemo(() => {
    if (activeTab !== null) {
      return null;
    }

    const count = upcomingWeekData.items.length;

    return {
      icon: "calendar-outline" as const,
      title: "Upcoming This Week",
      subtitle: `${count} upcoming deal${count === 1 ? "" : "s"} and event${count === 1 ? "" : "s"}`,
    };
  }, [activeTab, upcomingWeekData.items.length]);

  // Navigation helpers
  // Use router.replace (not push) so no ghost entry is added to the native stack.
  // Our NavigationHistoryContext owns the back stack — router.push would create
  // a duplicate native stack entry that fights with context-driven goBack.
  const goToBarDetail = (id: string, backTo: BackTarget = "home") =>
    router.replace({
      pathname: "/bars/[id]",
      params: { id, backTo },
    });

  return (
    <SafeAreaView
      style={[styles.container, { paddingTop: 50 + insets.top, paddingBottom: 10 }]}
      edges={["left", "right"]}
    >
      {/* Loading state */}
      {isLoading && (
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
          bounces={true}
          alwaysBounceVertical={true}
          overScrollMode="never"
          onLayout={(event) => {
            viewportHeightRef.current = event.nativeEvent.layout.height;
          }}
          onContentSizeChange={(_, contentHeight) => {
            contentHeightRef.current = contentHeight;
          }}
          onScrollBeginDrag={(event) => {
            const y = event.nativeEvent.contentOffset.y;
            const maxY = Math.max(0, contentHeightRef.current - viewportHeightRef.current);
            const clampedY = Math.max(0, Math.min(y, maxY));
            lastScrollYRef.current = clampedY;
            dragStartYRef.current = clampedY;
          }}
          onScrollEndDrag={(event) => {
            const velocityY = event.nativeEvent.velocity?.y ?? 0;
            const hasMomentum = Math.abs(velocityY) > 0.2;
            if (!hasMomentum) {
              decideHeaderVisibilityAtRest(event.nativeEvent.contentOffset.y);
              dragStartYRef.current = lastScrollYRef.current;
            }
          }}
          onMomentumScrollEnd={(event) => {
            const endYRaw = event.nativeEvent.contentOffset.y;
            const maxY = Math.max(0, contentHeightRef.current - viewportHeightRef.current);
            const endY = Math.max(0, Math.min(endYRaw, maxY));

            // Do not hide/show at momentum end; this can override upward reveal
            // and cause the header to feel stuck. Only force-show near top.
            if (endY <= TOP_FORCE_SHOW_PX) {
              setHeaderVisibility(true);
            }

            lastScrollYRef.current = endY;
            dragStartYRef.current = endY;
          }}
          onScroll={handleVerticalScroll}
          scrollEventThrottle={16}
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
          {/* {activeTab === null && (
            <>
              <View style={styles.tabSummaryRow}>
                <View style={styles.tabSummaryIcon}>
                  <Ionicons name={homeSummary?.icon ?? "calendar-outline"} size={18} color={Theme.dark.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tabSummaryTitle}>{homeSummary?.title}</Text>
                  <Text style={styles.tabSummarySubtitle}>{homeSummary?.subtitle}</Text>
                </View>
              </View>
              <UpcomingSection data={upcomingWeekData} onBarPress={goToBarDetail} />
            </>
          )} */}

          {/* Content area logic for "Home" (no tab selected) */}
          {activeTab === null && (
            <>
              {/* 1. Show the "Upcoming This Week" header only if there is matching data */}
              {upcomingWeekData.items.length > 0 ? (
                <View style={styles.tabSummaryRow}>
                  <View style={styles.tabSummaryIcon}>
                    <Ionicons
                      name={homeSummary?.icon ?? "calendar-outline"}
                      size={18}
                      color={Theme.dark.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tabSummaryTitle}>{homeSummary?.title}</Text>
                    <Text style={styles.tabSummarySubtitle}>{homeSummary?.subtitle}</Text>
                  </View>
                </View>
              ) : (
                /* 2. Spacer to keep the "No matching" message aligned across all views */
                <View style={{ height: 48 }} />
              )}

              {/* 3. The section itself handles the "No matching" UI internally */}
              <UpcomingSection data={upcomingWeekData} onBarPress={goToBarDetail} />
            </>
          )}

          {/* {activeTab === "open" && (
            <View style={styles.tabSummaryRow}>
              <View style={styles.tabSummaryIcon}>
                <Ionicons name={activeSummary?.icon ?? "time-outline"} size={18} color={Theme.dark.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tabSummaryTitle}>{activeSummary?.title}</Text>
                <Text style={styles.tabSummarySubtitle}>{activeSummary?.subtitle}</Text>
              </View>
            </View>
          )}

          {activeTab === "open" && (
            <OpenNowSection data={filteredBars} onBarPress={(id) => goToBarDetail(id, "tonight-open")} />
          )} */}

          {activeTab === "open" && (
            <>
              {/* Use a ternary to switch between the Header and the Spacer */}
              {filteredBars.length > 0 ? (
                <View style={styles.tabSummaryRow}>
                  <View style={styles.tabSummaryIcon}>
                    <Ionicons
                      name={activeSummary?.icon ?? "time-outline"}
                      size={18}
                      color={Theme.dark.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tabSummaryTitle}>{activeSummary?.title}</Text>
                    <Text style={styles.tabSummarySubtitle}>{activeSummary?.subtitle}</Text>
                  </View>
                </View>
              ) : (
                /* This maintains the vertical alignment when the header disappears */
                <View style={{ height: 48 }} />
              )}

              {/* This component stays outside the ternary so it can show the "No Matching" state */}
              <OpenNowSection
                data={filteredBars}
                onBarPress={(id) => goToBarDetail(id, "tonight-open")}
                query={query}
              />
            </>
          )}

          {/* {activeTab === "deals" && (
            <View style={styles.tabSummaryRow}>
              <View style={styles.tabSummaryIcon}>
                <Ionicons name={activeSummary?.icon ?? "pricetag-outline"} size={18} color={Theme.dark.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tabSummaryTitle}>{activeSummary?.title}</Text>
                <Text style={styles.tabSummarySubtitle}>{activeSummary?.subtitle}</Text>
              </View>
            </View>
          )}

          {activeTab === "deals" && (
            <DealsSection data={filteredDeals} onBarPress={(id) => goToBarDetail(id, "tonight-deals")} />
          )} */}

          {activeTab === "deals" && (
            <>
              {/* 1. Show the Summary Row if there's data, otherwise show the spacer */}
              {filteredDeals.length > 0 ? (
                <View style={styles.tabSummaryRow}>
                  <View style={styles.tabSummaryIcon}>
                    <Ionicons
                      name={activeSummary?.icon ?? "pricetag-outline"}
                      size={18}
                      color={Theme.dark.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tabSummaryTitle}>{activeSummary?.title}</Text>
                    <Text style={styles.tabSummarySubtitle}>{activeSummary?.subtitle}</Text>
                  </View>
                </View>
              ) : (
                /* Spacer to match the Friends tab and maintain the message position */
                <View style={{ height: 48 }} />
              )}

              {/* 2. Render the DealsSection below the header/spacer */}
              <DealsSection
                data={filteredDeals}
                onBarPress={(id) => goToBarDetail(id, "tonight-deals")}
                query={query}
              />
            </>
          )}

          {activeTab === "friends" && (
            <FriendsSection
              query={query}
              onBarPress={(id) => goToBarDetail(id, "tonight-friends")}
              onFriendPress={(friendId) =>
                router.replace({
                  pathname: "/(app)/(tabs)/map",
                  params: {
                    selectedFriendId: String(friendId),
                    focusToken: String(Date.now()),
                  },
                })
              }
            />
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
  tabSummaryRow: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tabSummaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.search.background,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
  },
  tabSummaryTitle: {
    color: Theme.container.titleText,
    fontSize: 16,
    fontWeight: "700",
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  tabSummarySubtitle: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    marginTop: 2,
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