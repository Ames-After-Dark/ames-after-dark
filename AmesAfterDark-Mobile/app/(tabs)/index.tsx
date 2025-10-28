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

// -------- Types --------
type TabKey = "open" | "deals" | "friends";

type TonightItem = {
  id: string;
  bar: string;
  event: string;
  specials?: string;
  isOpen: boolean;
  hasDeal: boolean;
};

type FriendItem = {
  id: string;
  name: string;
  bar: string;
  avatar?: any;
};

// -------- Mock Data  --------
const BARS: TonightItem[] = [
  {
    id: "1",
    bar: "Outlaws",
    event: "Live Band Tonight",
    specials: "No cover before 10pm",
    isOpen: true,
    hasDeal: true,
  },
  {
    id: "2",
    bar: "Paddy's Irish Pub",
    event: "Beer Garden + DJ",
    specials: "2-for-1 Cocktails 9–11",
    isOpen: true,
    hasDeal: true,
  },
  {
    id: "3",
    bar: "BNC Fieldhouse",
    event: "College Night",
    specials: "Free entry with ISU ID",
    isOpen: false,
    hasDeal: false,
  },
  {
    id: "4",
    bar: "Welch Ave Station",
    event: "Karaoke Night",
    specials: "$3 You-Call-Its",
    isOpen: true,
    hasDeal: true,
  },
  {
    id: "5",
    bar: "Cy's Roost",
    event: "DJ + Dance Floor",
    specials: "Ladies Night Specials",
    isOpen: true,
    hasDeal: false,
  },
  {
    id: "6",
    bar: "AJ’s Ultra Lounge",
    event: "Glow Party",
    specials: "$5 Fishbowls All Night",
    isOpen: true,
    hasDeal: true,
  },
  {
    id: "7",
    bar: "Mickey’s Irish Pub",
    event: "0",
    specials: "$2 Domestic Drafts",
    isOpen: true,
    hasDeal: true,
  },
  {
    id: "8",
    bar: "Sips",
    event: "Live DJ Set",
    specials: "Half-Price Cherry Bombs 8-10pm",
    isOpen: true,
    hasDeal: true,
  },
];

const FRIENDS: FriendItem[] = [
  { id: "f1", name: "Chase Anderson", bar: "Outlaws" },
  { id: "f2", name: "Jaya Davis", bar: "Paddy's Irish Pub" },
  { id: "f3", name: "Nathan Couture", bar: "Welch Ave Station" },
  { id: "f4", name: "Nathan Krieger", bar: "BNC Fieldhouse" },
  { id: "f5", name: "Analyn Seeman", bar: "Cy's Roost" },
  { id: "f6", name: "Maggie Sullivan", bar: "Paddy's Irish Pub" },
  { id: "f7", name: "Geni William", bar: "Outlaws" },
].map((f) => ({
  ...f,
  avatar: require("../../assets/images/Logo.png"), // placeholder avatar
}));

const TAB_META: { key: TabKey; label: string }[] = [
  { key: "open", label: "Open Now" },
  { key: "deals", label: "Deals Tonight" },
  { key: "friends", label: "Friends near you" },
];

export default function Tonight() {
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [query, setQuery] = useState("");

  const filteredBars = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = BARS;

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
  }, [activeTab, query]);

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

  // --- Navigation helpers (switch bottom tabs) ---
  const goToBarsTab = () => router.navigate("/(tabs)/bars");
  const goToFriendsTab = () => router.navigate("/(tabs)/friends");

  return (
    <SafeAreaView style={styles.container} >
    
      {/* ScrollView with sticky tabs */}
      <ScrollView
        stickyHeaderIndices={[1]} // tabs strip sticks; carousel scrolls away
        contentContainerStyle={{ paddingBottom: 10 }}
      >
        {/* Full, uncropped carousel */}
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
              resizeMode="contain" // show full image, no bottom cropping
            />
          ))}
        </ScrollView>

        {/* Sticky Tabs */}
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

          {/* Search */}
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

        {/* Content by tab */}
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

            // NEW: compute texts per tab
            const headerText   = isDealsView ? (item.specials || item.event) : item.bar;
            const subtitleText = isDealsView ? item.bar : item.event;
            const detailText   = isDealsView ? item.event : (item.specials ?? "");

            return (
              <View
                key={item.id}
                style={[styles.card, isDealsView && styles.cardDealsVariant]}
              >
                <Image
                  source={require("../../assets/images/Logo.png")}
                  style={styles.cardImg}
                />

                <View style={{ flex: 1 }}>
                  {/* Header */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{headerText}</Text>

                    {/* Open pill only on Open tab */}
                    {activeTab === "open" && (
                      <View
                        style={[
                          styles.statusPill,
                          { backgroundColor: item.isOpen ? "#22c55e" : "#6b7280" },
                        ]}
                      >
                        <Text style={styles.statusPillText}>
                          {item.isOpen ? "Open" : "Closed"}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Subtitle */}
                  <Text style={styles.cardSubtitle}>{subtitleText}</Text>

                  {/* Detail (optional) */}
                  {!!detailText && <Text style={styles.cardDetail}>{detailText}</Text>}

                  {/* DEAL chip on Deals view */}
                  {isDealsView && (
                    <View style={styles.dealChip}>
                      <Ionicons name="pricetags-outline" size={12} color="#22d3ee" />
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

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 1,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topLogo: { width: 160, height: 32 },

  heroImage: {
    width: 280,
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1F2937",
    backgroundColor: "#0f172a", // behind contain-fit
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
    borderWidth: 2, // outlined
    borderColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBtnActive: {
    borderColor: "#38bdf8", // neon outline
  },
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
  searchInput: {
    flex: 1,
    color: "#E5E7EB",
    fontSize: 14,
    paddingVertical: 0,
  },

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
  friendName: {
    color: "#f1f5f9",
    fontWeight: "700",
    fontSize: 14,
  },
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
