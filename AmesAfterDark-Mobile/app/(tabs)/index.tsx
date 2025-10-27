// app/(tabs)/tonight.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

// ---------- Mock Data (Welch Ave, Ames) ----------
type TonightItem = {
  id: string;
  bar: string;
  event: string;
  specials?: string;
  image?: any;           // require() image
  isOpen: boolean;
  hasDeal: boolean;      // for "Deals Tonight"
  friendsHere?: number;  // for "Friends near you"
};

const MOCK_TONIGHT: TonightItem[] = [
  {
    id: "1",
    bar: "Outlaws",
    event: "Live Band Tonight",
    specials: "No cover before 10pm",
    image: require("../../assets/images/Logo.png"),
    isOpen: true,
    hasDeal: true,
    friendsHere: 3,
  },
  {
    id: "2",
    bar: "Paddy's Irish Pub",
    event: "Beer Garden + DJ",
    specials: "2-for-1 Cocktails 9–11",
    image: require("../../assets/images/Logo.png"),
    isOpen: true,
    hasDeal: true,
    friendsHere: 1,
  },
  {
    id: "3",
    bar: "BNC Fieldhouse",
    event: "College Night",
    specials: "Free entry with ISU ID",
    image: require("../../assets/images/Logo.png"),
    isOpen: false,
    hasDeal: false,
    friendsHere: 0,
  },
  {
    id: "4",
    bar: "Welch Ave Station",
    event: "Karaoke",
    specials: "$3 You-Call-Its",
    image: require("../../assets/images/Logo.png"),
    isOpen: true,
    hasDeal: true,
    friendsHere: 4,
  },
  {
    id: "5",
    bar: "Cy's Roost",
    event: "DJ + Dance Floor",
    specials: "Ladies Night",
    image: require("../../assets/images/Logo.png"),
    isOpen: true,
    hasDeal: false,
    friendsHere: 0,
  },
];

// ---------- Tabs ----------
type TabKey = "open" | "deals" | "friends";

const TABS: { key: TabKey; label: string }[] = [
  { key: "open", label: "Open Now" },
  { key: "deals", label: "Deals Tonight" },
  { key: "friends", label: "Friends near you" },
];

// ---------- Component ----------
export default function Tonight() {
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [query, setQuery] = useState("");

  const filteredData = useMemo(() => {
    const q = query.trim().toLowerCase();

    let data = MOCK_TONIGHT;

    // tab filters
    if (activeTab === "open") {
      data = data.filter((d) => d.isOpen);
    } else if (activeTab === "deals") {
      data = data.filter((d) => d.hasDeal);
    } else if (activeTab === "friends") {
      data = data.filter((d) => (d.friendsHere ?? 0) > 0);
    }

    // search filter (bar or event)
    if (q.length) {
      data = data.filter(
        (d) =>
          d.bar.toLowerCase().includes(q) ||
          d.event.toLowerCase().includes(q)
      );
    }

    return data;
  }, [activeTab, query]);

  const renderItem = ({ item }: { item: TonightItem }) => (
    <View style={styles.card}>
      <Image source={item.image} style={styles.cardImg} />
      <View style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.bar}</Text>

          {/* Open/Closed pill */}
          <View
            style={[
              styles.statusPill,
              { backgroundColor: item.isOpen ? "#22c55e" : "#6b7280" }, // green/gray
            ]}
          >
            <Text style={styles.statusPillText}>
              {item.isOpen ? "Open" : "Closed"}
            </Text>
          </View>
        </View>

        <Text style={styles.cardSubtitle}>{item.event}</Text>
        {!!item.specials && (
          <Text style={styles.cardDetail}>{item.specials}</Text>
        )}

        {/* Friends indicator (only if > 0) */}
        {(item.friendsHere ?? 0) > 0 && (
          <Text style={styles.cardFriends}>
            {item.friendsHere} friend{(item.friendsHere ?? 0) > 1 ? "s" : ""} nearby
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#a3a3a3" />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top bar with logo */}
      <View style={styles.topBar}>
        <Image
          source={require("../../assets/images/LogoTopBar.png")}
          style={styles.topLogo}
          resizeMode="contain"
        />
        <Ionicons name="settings-outline" size={20} color="#d4d4d8" />
      </View>

      {/* Image Carousel (3 x Logo.png placeholders) */}
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
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Section header + tabs */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Events Tonight</Text>
        <View style={styles.tabsRow}>
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No results for tonight.</Text>
        }
      />
    </SafeAreaView>
  );
}

// ---------- Styles (dark + neon vibe) ----------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C12" },

  topBar: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topLogo: { width: 160, height: 32 },

  heroImage: {
    width: 260,
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#1F2937",
  },

  sectionHeader: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: {
    color: "#E5E7EB",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },

  tabsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#1F2937",
    borderWidth: 1,
    borderColor: "#272A36",
  },
  tabBtnActive: {
    backgroundColor: "#0ea5e9", // neon-ish blue
    borderColor: "#38bdf8",
  },
  tabText: { color: "#cbd5e1", fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#05131a" },

  searchBox: {
    marginHorizontal: 16,
    marginBottom: 4,
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
  cardFriends: {
    color: "#60a5fa",
    marginTop: 6,
    fontWeight: "600",
    fontSize: 12,
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

  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 24,
    fontSize: 13,
  },
});
