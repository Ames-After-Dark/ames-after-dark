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
import type { BarGroupedTonight, BarDealOrEvent } from "@/hooks/useTonightData";
import { useBars } from "@/hooks/useBars";

import { shouldForceErrorPage } from "@/utils/dev-error-pages";
import ErrorState from "@/components/ui/error-state";

import { Theme } from "@/constants/theme";
import { getLogoAssetForLocationName } from "@/utils/locationLogos";
// import type { Friend } from "@/types/types";

import OpenNowSection from "@/components/tonight/open-now-sections";
import FriendsSection from "@/components/tonight/friends-section";
import TonightHero from "@/components/tonight/hero-carousel";
import { TonightSkeleton } from "@/components/tonight/tonight-skeleton";

import { useTopHeaderVisibility } from '@/context/top-header-visibility';
import { DealEventModal, DealEventPill } from "@/components/bars/deal-event-modal";

// Simple static metadata that drives the tab UI (key used in logic, label shown in UI)
const TAB_META = [
  { key: "open", label: "Open Now" },
  { key: "deals", label: "Tonight" },
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

// ─── Tonight Tab ─────────────────────────────────────────────────────────────
// Renders bars grouped by deals/events, matching the Friends Near You pattern.

function formatTime(d?: Date): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

// DealEventPill and DealEventModal live in @/components/bars/deal-event-modal


// ─── Bar Group Row ─────────────────────────────────────────────────────────────
function BarGroupRow({
  group,
  isExpanded,
  onToggle,
  onBarPress,
  onItemPress,
}: {
  group: BarGroupedTonight;
  isExpanded: boolean;
  onToggle: () => void;
  onBarPress: (id: string) => void;
  onItemPress: (item: BarDealOrEvent) => void;
}) {
  const hasMore = group.rest.length > 0;

  const sortedRest = React.useMemo(() =>
    [...group.rest].sort((a, b) => {
      const tA = a.startTimeUtc?.getTime() ?? Infinity;
      const tB = b.startTimeUtc?.getTime() ?? Infinity;
      return tA - tB;
    }),
  [group.rest]);

  return (
    <View style={[groupStyles.cardShell, isExpanded && groupStyles.cardShellExpanded]}>
      {/* Main card row — split tap zones */}
      <View style={groupStyles.card}>
        {/* Logo — tapping opens bar detail */}
        <Pressable onPress={() => onBarPress(group.barId)}>
          <Image
            source={getLogoAssetForLocationName(group.barName)}
            style={groupStyles.cardImage}
            resizeMode="cover"
          />
        </Pressable>

        {/* Text — tapping opens popup */}
        <Pressable style={{ flex: 1 }} onPress={() => onItemPress(group.highlight)}>
          <Text style={groupStyles.cardTitle} numberOfLines={1}>
            {group.highlight.title}
          </Text>
          {group.highlight.startTimeUtc ? (
            <Text style={groupStyles.cardSubtitle}>{formatTime(group.highlight.startTimeUtc)}</Text>
          ) : null}
          <Text style={groupStyles.cardDetail}>{group.barName}</Text>
        </Pressable>

        {/* Right side — tapping toggles expand (or opens popup if no extras) */}
        <Pressable
          style={groupStyles.cardRight}
          onPress={hasMore ? onToggle : () => onItemPress(group.highlight)}
        >
          <DealEventPill kind={group.highlight.kind} />
          {hasMore && (
            <>
              <Text style={groupStyles.moreText}>+{group.rest.length}</Text>
              <Ionicons
                name={isExpanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={Theme.search.inactiveInput}
              />
            </>
          )}
        </Pressable>
      </View>

      {/* Expanded panel */}
      {isExpanded && (
        <View style={groupStyles.expandedPanel}>
          <View style={groupStyles.panelHeader}>
            <Text style={groupStyles.panelHeaderTitle}>Also Tonight</Text>
            <Text style={groupStyles.panelHeaderCount}>{group.rest.length}</Text>
          </View>
          <View style={groupStyles.itemList}>
            {sortedRest.map((item) => (
              <Pressable
                key={item.id}
                style={groupStyles.itemRow}
                onPress={() => onItemPress(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={groupStyles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  {item.startTimeUtc ? (
                    <Text style={groupStyles.itemMeta}>{formatTime(item.startTimeUtc)}</Text>
                  ) : null}
                </View>
                <DealEventPill kind={item.kind} />
                <Ionicons name="chevron-forward" size={16} color={Theme.search.inactiveInput} />
              </Pressable>
            ))}
          </View>

          {/* Action buttons */}
          <View style={groupStyles.expandedActions}>
            <Pressable style={groupStyles.detailsButton} onPress={() => onBarPress(group.barId)}>
              <Text style={groupStyles.detailsButtonText}>View {group.barName} Details</Text>
            </Pressable>
            <Pressable style={groupStyles.closeButton} onPress={onToggle}>
              <Text style={groupStyles.closeButtonText}>Collapse</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function BarGroupedList({
  groups,
  query,
  onBarPress,
  closeExpanded,
  setExpandedBarId,
  expandedBarId,
}: {
  groups: BarGroupedTonight[];
  query: string;
  onBarPress: (id: string) => void;
  closeExpanded: () => void;
  setExpandedBarId: (id: string | null) => void;
  expandedBarId: string | null;
}) {
  const [selectedItem, setSelectedItem] = React.useState<BarDealOrEvent | null>(null);
  const [selectedBarId, setSelectedBarId] = React.useState<string>("");
  const [selectedBarName, setSelectedBarName] = React.useState<string>("");

  const filtered = React.useMemo(() => {
    const now = new Date();
    const q = query.trim().toLowerCase();

    let result = q
      ? groups.filter(
          (g) =>
            g.barName.toLowerCase().includes(q) ||
            g.highlight.title.toLowerCase().includes(q) ||
            g.rest.some((r) => r.title.toLowerCase().includes(q))
        )
      : [...groups];

    // Sort by highlight start time closest to now
    result.sort((a, b) => {
      const distA = a.highlight.startTimeUtc
        ? Math.abs(a.highlight.startTimeUtc.getTime() - now.getTime())
        : Infinity;
      const distB = b.highlight.startTimeUtc
        ? Math.abs(b.highlight.startTimeUtc.getTime() - now.getTime())
        : Infinity;
      return distA - distB;
    });

    return result;
  }, [groups, query]);

  const openPopup = (item: BarDealOrEvent, barId: string, barName: string) => {
    setSelectedItem(item);
    setSelectedBarId(barId);
    setSelectedBarName(barName);
  };

  const closePopup = () => setSelectedItem(null);

  if (filtered.length === 0) {
    return (
      <View style={groupStyles.stateContainer}>
        <View style={groupStyles.iconCircle}>
          <Ionicons name="pricetags-outline" size={40} color={Theme.dark.primary} />
        </View>
        <Text style={groupStyles.comingSoonHeader}>
          {query.trim() ? "No matching deals or events" : "No deals or events tonight"}
        </Text>
        <Text style={groupStyles.emptyText}>
          {query.trim()
            ? "Try a different search term or clear the filter."
            : "Check back later tonight for live deals and events."}
        </Text>
      </View>
    );
  }

  return (
    <View style={groupStyles.container}>
      <DealEventModal
        item={selectedItem ? { id: selectedItem.id, kind: selectedItem.kind, title: selectedItem.title, subtitle: selectedItem.subtitle, startTime: selectedItem.startTimeUtc ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).format(selectedItem.startTimeUtc) : undefined } : null}
        barName={selectedBarName}
        barId={selectedBarId}
        onClose={closePopup}
        onBarPress={onBarPress}
      />

      {/* Header row */}
      <View style={groupStyles.headerRow}>
        <View style={groupStyles.headerIcon}>
          <Ionicons name="pricetag" size={18} color={Theme.dark.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={groupStyles.sectionTitle}>Tonight</Text>
          <Text style={groupStyles.sectionSubtitle}>
            {filtered.length} bar{filtered.length === 1 ? "" : "s"} with deals or events
          </Text>
        </View>
      </View>

      <View style={groupStyles.cardsList}>
        {filtered.map((group) => (
          <BarGroupRow
            key={group.barId}
            group={group}
            isExpanded={expandedBarId === group.barId}
            onToggle={() => setExpandedBarId(expandedBarId === group.barId ? null : group.barId)}
            onBarPress={onBarPress}
            onItemPress={(item) => openPopup(item, group.barId, group.barName)}
          />
        ))}
      </View>
    </View>
  );
}

const groupStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 92,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Theme.search.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
  },
  sectionTitle: {
    color: Theme.container.titleText,
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  sectionSubtitle: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    marginTop: 2,
  },
  cardsList: {
    gap: 12,
    zIndex: 1,
  },
  cardShell: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
    backgroundColor: Theme.container.background,
    overflow: "hidden",
  },
  cardShellExpanded: {
    borderColor: Theme.dark.primary,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  cardImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
  },
  cardTitle: {
    color: Theme.container.titleText,
    fontWeight: "800",
    fontSize: 14,
  },
  cardSubtitle: {
    color: Theme.container.inactiveText,
    marginTop: 2,
    fontSize: 13,
  },
  cardDetail: {
    color: Theme.container.inactiveText,
    marginTop: 2,
    fontSize: 12,
  },
  cardRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moreText: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    fontWeight: "600",
  },
  expandedPanel: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Theme.container.secondaryBorder,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  panelHeaderTitle: {
    color: Theme.container.titleText,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  panelHeaderCount: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    fontWeight: "700",
  },
  itemList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  itemTitle: {
    color: Theme.container.titleText,
    fontSize: 13,
    fontWeight: "700",
  },
  itemMeta: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    marginTop: 1,
  },
  expandedActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    flexWrap: "wrap",
  },
  detailsButton: {
    flex: 1,
    backgroundColor: Theme.dark.primary,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  detailsButtonText: {
    color: Theme.dark.white,
    fontWeight: "800",
    fontSize: 13,
  },
  closeButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
    backgroundColor: Theme.search.background,
  },
  closeButtonText: {
    color: Theme.container.titleText,
    fontWeight: "700",
    fontSize: 13,
  },
  stateContainer: {
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.search.background,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.container.secondaryBorder,
  },
  comingSoonHeader: {
    color: Theme.container.titleText,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    color: Theme.container.inactiveText,
    textAlign: "center",
    marginTop: 8,
    fontSize: 13,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});

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
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  // Global search query (filters both bars and friends)
  const [query, setQuery] = useState("");
  // Expanded bar in Tonight tab — lifted here so ScrollView can close it on drag
  const [tonightExpandedBarId, setTonightExpandedBarId] = useState<string | null>(null);

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
  const { barsWithTonightData, barGroupsTonight, loading, error } = useTonightData();
  const { bars: scheduledBars, loading: scheduledBarsLoading } = useBars();

  const friendsLoading = false;
  const friendsError = null;

  const hasError = !!error || !!friendsError || shouldForceErrorPage("tonight");
  const isLoading = loading || friendsLoading || scheduledBarsLoading;

  // ----- Filter for "Open Now" tab -----
  const filteredBars = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = barsWithTonightData.filter((d) => d.isOpen);
    if (q) {
      data = data.filter(
        (d) =>
          (d.bar || "").toLowerCase().includes(q) ||
          (d.event || "").toLowerCase().includes(q) ||
          (d.specials ?? "").toLowerCase().includes(q)
      );
    }
    return data;
  }, [query, barsWithTonightData]);

  const activeSummary = useMemo(() => {
    const count = filteredBars.length;
    return {
      icon: "time-outline" as const,
      title: "Open Now",
      subtitle: `${count} bar${count === 1 ? "" : "s"} currently open`,
    };
  }, [filteredBars.length]);

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
            // Close any expanded dropdown when user starts scrolling
            if (tonightExpandedBarId !== null) setTonightExpandedBarId(null);
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

            {/* Tab row: renders from TAB_META, always switches (no toggle off) */}
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

          {/* Content area switches between: open now | deals tonight | friends near you */}

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

          {activeTab === "deals" && (
            <BarGroupedList
              groups={barGroupsTonight}
              query={query}
              onBarPress={(id) => goToBarDetail(id, "tonight-deals")}
              expandedBarId={tonightExpandedBarId}
              setExpandedBarId={setTonightExpandedBarId}
              closeExpanded={() => setTonightExpandedBarId(null)}
            />
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
    borderColor: Theme.dark.primary,
    backgroundColor: Theme.dark.primary + "22", // subtle fill
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