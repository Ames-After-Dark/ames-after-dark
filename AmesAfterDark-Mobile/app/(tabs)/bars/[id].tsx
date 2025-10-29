import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import React, { useState } from "react";
import { BAR_DETAILS_BY_ID, BarBase } from "@/data/mock";
import { getNow } from "@/constants/time";

// ---------- Helper: check active deals/events ----------
function isActive(rule: any, now: Date): boolean {
  if (!rule) return false;
  if (rule.kind === "one-time") {
    const start = new Date(rule.start);
    const end = new Date(rule.end);
    return now >= start && now <= end;
  }
  if (rule.kind === "weekly") {
    const day = now.getDay();
    if (!rule.daysOfWeek.includes(day)) return false;
    const [sh, sm] = rule.startLocalTime.split(":").map(Number);
    const [eh, em] = rule.endLocalTime.split(":").map(Number);
    const local = new Date(
      now.toLocaleString("en-US", { timeZone: rule.tz })
    );
    const minutes = local.getHours() * 60 + local.getMinutes();
    return minutes >= sh * 60 + sm && minutes <= eh * 60 + em;
  }
  return false;
}

export default function BarProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const now = getNow();

  const initialBar = BAR_DETAILS_BY_ID[id as keyof typeof BAR_DETAILS_BY_ID];
  const [bar, setBar] = useState<BarBase | null>(initialBar || null);

  if (!bar) {
    return (
      <View style={styles.container}>
        <Text style={{ color: "white" }}>Bar not found.</Text>
      </View>
    );
  }

  const toggleFavorite = () =>
    setBar({ ...bar, favorite: !bar.favorite });

  // Active + upcoming items
  const activeDeals = bar.dealsScheduled?.filter((d) => isActive(d.rule, now)) ?? [];
  const upcomingDeals =
    bar.dealsScheduled?.filter((d) => !isActive(d.rule, now)) ?? [];

  const activeEvents = bar.eventsScheduled?.filter((e) =>
    isActive(e.rule, now)
  ) ?? [];
  const upcomingEvents =
    bar.eventsScheduled?.filter((e) => !isActive(e.rule, now)) ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Cover Photo */}
      <Image source={bar.cover} style={styles.coverPhoto} resizeMode="cover" />

      {/* Header */}
      <View style={styles.headerRow}>
        <Image source={bar.logo} style={styles.barImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.barName}>{bar.name}</Text>
          <Text style={styles.barDescription}>{bar.description}</Text>
        </View>
        <TouchableOpacity onPress={toggleFavorite}>
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

      {/* Active Events */}
      {activeEvents.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Happening Now</Text>
          {activeEvents.map((event, index) => (
            <Text key={index} style={styles.sectionItem}>
              • {event.name}
            </Text>
          ))}
        </View>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upcoming Events</Text>
          {upcomingEvents.map((event, index) => (
            <Text key={index} style={styles.sectionItem}>
              • {event.name}
            </Text>
          ))}
        </View>
      )}

      {/* Active Deals */}
      {activeDeals.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Active Deals</Text>
          {activeDeals.map((deal, index) => (
            <Text key={index} style={styles.sectionItem}>
              • {deal.title} {deal.subtitle ? `(${deal.subtitle})` : ""}
            </Text>
          ))}
        </View>
      )}

      {/* Upcoming Deals */}
      {upcomingDeals.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Upcoming Deals</Text>
          {upcomingDeals.map((deal, index) => (
            <Text key={index} style={styles.sectionItem}>
              • {deal.title} {deal.subtitle ? `(${deal.subtitle})` : ""}
            </Text>
          ))}
        </View>
      )}

      {/* Bottom Buttons */}
      <View style={styles.bottomRow}>
        <TouchableOpacity
          style={styles.bottomCard}
          onPress={() => router.push("/map")}
        >
          <View style={styles.bottomCardHeader}>
            <Text style={styles.bottomCardTitle}>Map</Text>
            <Text style={styles.bottomCardArrow}>{">"}</Text>
          </View>
          <Image source={bar.mapImage} style={styles.bottomCardImage} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomCard}
          onPress={() => router.push("/gallery")}
        >
          <View style={styles.bottomCardHeader}>
            <Text style={styles.bottomCardTitle}>Gallery</Text>
            <Text style={styles.bottomCardArrow}>{">"}</Text>
          </View>
          <Image source={bar.galleryImage} style={styles.bottomCardImage} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0b12",
  },
  coverPhoto: {
    width: "100%",
    height: 180,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  barImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12,
  },
  barName: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
  barDescription: {
    color: "white",
    fontSize: 14,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    marginHorizontal: 12,
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    color: "white",
    fontSize: 12,
  },
  sectionContainer: {
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  sectionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  sectionItem: {
    color: "#E5E5E5",
    fontSize: 14,
    marginVertical: 2,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    margin: 12,
  },
  bottomCard: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 4,
    padding: 8,
  },
  bottomCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  bottomCardTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomCardArrow: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  bottomCardImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
  },
});
