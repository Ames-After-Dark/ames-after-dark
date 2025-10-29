// app/(tabs)/tonight.tsx
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

import { BARS_BASE, FRIENDS, BarBase } from "@/src/data/mock";
import { getNow, isActive, isBarOpen } from "@/src/config/time";

// Tabs
const TAB_META = [
  { key: "open", label: "Open Now" },
  { key: "deals", label: "Deals Tonight" },
  { key: "friends", label: "Friends near you" },
] as const;

type TabKey = typeof TAB_META[number]["key"];


export default function Tonight() {
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [query, setQuery] = useState("");
  const now = getNow();

  // ----- Compute “active” and “hasDeal” dynamically -----
  const barsWithTonightData = useMemo(() => {
    return BARS_BASE.map((b) => {
      const activeDeals =
        b.dealsScheduled?.filter((d) => isActive(d.rule, now)) ?? [];
      const activeEvents =
        b.eventsScheduled?.filter((e) => isActive(e.rule, now)) ?? [];

      return {
        id: b.id,
        bar: b.name,
        event: activeEvents[0]?.name ?? b.eventsScheduled?.[0]?.name ?? "",
        specials: activeDeals[0]?.title ?? "",
        isOpen: isBarOpen(b, now),
        hasDeal: activeDeals.length > 0,
        image: b.logo,
      };
    });
  }, [now]);

  // ----- Filter for active tab -----
  const filteredBars = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = barsWithTonightData;

    if (activeTab === "open") data = data.filter((d) => d.isOpen);
    if (activeTab === "deals") data = data.filter((d) => d.hasDeal);

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

  const goToBarsTab = () => router.navigate("/(tabs)/bars");
  const goToFriendsTab = () => router.navigate("/(tabs)/friends");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        stickyHeaderIndices={[1]}
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {/* Deals carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingHorizontal: 16 }}
          style={{ marginBottom: 12 }}
        >
          {[1, 2, 3].map((n) => (
            <Image
              key={n}
              source={require("../../assets/images/Logo.png")}
              style={styles.heroImage}
              resizeMode="contain"
            />
          ))}
        </ScrollView>

        {/* Sticky Tabs + Search */}
        <View style={styles.stickyTabs}>
          <Text style={styles.sectionTitle}>Events Tonight</Text>
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

          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#a3a3a3" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
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

        {/* Content */}
        {activeTab === "friends" ? (
          <View style={styles.friendsList}>
            {filteredFriends.map((f) => (
              <Pressable
                key={f.id}
                onPress={goToFriendsTab}
                style={styles.friendTile}
              >
                <Image source={f.avatar!} style={styles.friendAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.friendName}>{f.name}</Text>
                  <Text style={styles.friendBar}>{f.bar}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#a3a3a3" />
              </Pressable>
            ))}
            {!filteredFriends.length && (
              <Text style={styles.emptyText}>No nearby friends found.</Text>
            )}
          </View>
        ) : (
          <View style={styles.cardsList}>
            {filteredBars.map((item) => {
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
                  <Image
                    source={item.image}
                    style={styles.cardImg}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{headerText}</Text>
                      {activeTab === "open" && (
                        <View
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor: item.isOpen
                                ? "#22c55e"
                                : "#6b7280",
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
                  <Pressable onPress={goToBarsTab} hitSlop={8}>
                    <Ionicons name="chevron-forward" size={18} color="#a3a3a3" />
                  </Pressable>
                </View>
              );
            })}
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
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C12" },
  heroImage: {
    width: 280,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
    backgroundColor: "#0f172a",
  },
  stickyTabs: {
    backgroundColor: "#0B0C12",
    paddingTop: 6,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: "#E5E7EB",
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
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: { borderColor: "#38bdf8" },
  tabText: { color: "#cbd5e1", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#e0f2fe" },
  searchBox: {
    marginHorizontal: 16,
    marginTop: 2,
    backgroundColor: "#111827",
    borderColor: "#1f2937",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, color: "#E5E7EB", fontSize: 14, paddingVertical: 0 },
  cardsList: { padding: 16, gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardDealsVariant: {
    borderColor: "#164e63",
    backgroundColor: "#0b1420",
  },
  cardImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { color: "#f1f5f9", fontWeight: "800", fontSize: 14 },
  cardSubtitle: { color: "#cbd5e1", marginTop: 2, fontSize: 13 },
  cardDetail: { color: "#94a3b8", marginTop: 2, fontSize: 12 },
  dealChip: {
    marginTop: 8,
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 8,
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
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f2937",
  },
  friendName: { color: "#f1f5f9", fontWeight: "700", fontSize: 14 },
  friendBar: {
    color: "#93c5fd",
    fontWeight: "600",
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 24,
    fontSize: 13,
  },
});
