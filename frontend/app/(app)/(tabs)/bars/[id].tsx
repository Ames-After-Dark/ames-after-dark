// app/bars/[id].tsx
import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import { useBarDetail } from "@/hooks/useBarDetail";
import { getNow, isActive, isBarOpen } from "@/config/time";
import { IMG } from "@/assets/assets"; // ✅ placeholder fallbacks  ../../../../assets/assets.ts

export default function BarProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { bar, loading } = useBarDetail(id);
  const now = getNow();

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#33CCFF" />
      </View>
    );
  }

  if (!bar) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white", padding: 16 }}>Bar not found.</Text>
      </View>
    );
  }

  // ---- Active items (respect schedules) ----
  const activeDeals  = bar.dealsScheduled?.filter(d => isActive(d.rule, now)) ?? [];
  const activeEvents = bar.eventsScheduled?.filter(e => isActive(e.rule, now)) ?? [];
  const openNow = isBarOpen(bar, now);

  // ---- Image sources (URL → mock require → placeholder) ----
  const coverSrc =
    bar.coverUrl ? { uri: bar.coverUrl } :
    bar.cover    ? bar.cover :
    IMG.LOGO;

  const logoSrc =
    bar.logoUrl ? { uri: bar.logoUrl } :
    bar.logo    ? bar.logo :
    IMG.LOGO;

  const mapSrc =
    bar.mapImageUrl ? { uri: bar.mapImageUrl } :
    bar.mapImage    ? bar.mapImage :
    IMG.MAP ?? IMG.LOGO;

  const gallerySrc =
    bar.galleryImageUrl ? { uri: bar.galleryImageUrl } :
    bar.galleryImage    ? bar.galleryImage :
    IMG.GALLERY ?? IMG.LOGO;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Cover */}
      <Image source={coverSrc} style={styles.coverPhoto} resizeMode="cover" />

      {/* Header */}
      <View style={styles.headerRow}>
        <Image source={logoSrc} style={styles.barImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.barName}>{bar.name}</Text>
          <Text style={styles.barDescription}>{bar.description}</Text>

          <View
            style={[
              styles.statusPill,
              { backgroundColor: openNow ? "#22c55e" : "#6b7280" },
            ]}
          >
            <Text style={styles.statusPillText}>
              {openNow ? `Open until ${bar.closingTime ?? ""}` : "Closed"}
            </Text>
          </View>
        </View>

        <TouchableOpacity /* TODO: hook to POST /favorite later */>
          <FontAwesome
            name="star"
            size={24}
            color={bar.favorite ? "#33CCFF" : "grey"}
          />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{bar.visits ?? 0}</Text>
          <Text style={styles.statLabel}>Visits This Month</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{bar.friends ?? 0}</Text>
          <Text style={styles.statLabel}>Your Friends</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{bar.favorites ?? 0}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
      </View>

     <View style={{ marginHorizontal: 12, marginTop: 8 }}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push({ pathname: "/bars/menu", params: { id } })}
      >
        <Text style={styles.menuButtonText}>View Menu</Text>
      </TouchableOpacity>
    </View>

      {/* Current Events */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Current Events</Text>
        {activeEvents.length ? (
          activeEvents.map((e, i) => (
            <Text key={i} style={styles.sectionItem}>
              • {e.name}
            </Text>
          ))
        ) : (
          <Text style={styles.sectionItem}>No active events.</Text>
        )}
      </View>

      {/* Deals */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Deals</Text>
        {activeDeals.length ? (
          activeDeals.map((d, i) => (
            <Text key={i} style={styles.sectionItem}>
              • {d.title}
            </Text>
          ))
        ) : (
          <Text style={styles.sectionItem}>No active deals.</Text>
        )}
      </View>

      {/* Map + Gallery */}
      <View style={styles.bottomRow}>
        <TouchableOpacity style={styles.bottomCard} onPress={() => router.push("/map")}>
          <View style={styles.bottomCardHeader}>
            <Text style={styles.bottomCardTitle}>Map</Text>
            <Text style={styles.bottomCardArrow}></Text>
          </View>
          <Image source={mapSrc} style={styles.bottomCardImage} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomCard} onPress={() => router.push("/gallery")}>
          <View style={styles.bottomCardHeader}>
            <Text style={styles.bottomCardTitle}>Gallery</Text>
            <Text style={styles.bottomCardArrow}></Text>
          </View>
          <Image source={gallerySrc} style={styles.bottomCardImage} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12" },
  center: { justifyContent: "center", alignItems: "center" },
  coverPhoto: { width: "100%", height: 180 },

  headerRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  barImage: { width: 70, height: 70, borderRadius: 12, marginRight: 12 },
  barName: { color: "white", fontSize: 20, fontWeight: "700" },
  barDescription: { color: "white", fontSize: 14 },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  statusPillText: { color: "#0b0c12", fontSize: 10, fontWeight: "800", letterSpacing: 0.4 },

  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, marginHorizontal: 12 },
  statBox: { alignItems: "center" },
  statNumber: { color: "white", fontSize: 18, fontWeight: "700" },
  statLabel: { color: "white", fontSize: 12 },

  sectionContainer: { backgroundColor: "#1A1A1A", borderRadius: 12, padding: 14, marginHorizontal: 12, marginVertical: 6 },
  sectionTitle: { color: "white", fontSize: 18, fontWeight: "600", marginBottom: 6 },
  sectionItem: { color: "#E5E5E5", fontSize: 14, marginVertical: 2 },

  bottomRow: { flexDirection: "row", justifyContent: "space-around", margin: 12 },
  bottomCard: { flex: 1, borderRadius: 12, marginHorizontal: 4, padding: 8 },
  bottomCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  bottomCardTitle: { color: "white", fontSize: 16, fontWeight: "600" },
  bottomCardArrow: { color: "white", fontSize: 18, fontWeight: "800" },
  bottomCardImage: { width: "100%", height: 100, borderRadius: 8 },
  menuButton: { backgroundColor: "#33CCFF", paddingVertical: 10,borderRadius: 10,alignItems: "center",},
menuButtonText: {color: "#0b0b12", fontWeight: "800", fontSize: 16, letterSpacing: 0.3,},

});
