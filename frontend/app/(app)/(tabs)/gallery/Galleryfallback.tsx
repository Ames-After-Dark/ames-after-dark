import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { Theme } from "@/constants/theme";

const PREVIEW_ALBUMS = [
  { name: "Outlaw's", barName: "Outlaw's", date: "2-28", weekday: "Saturday" },
  { name: "Cy's", barName: "Cy's Bar", date: "2-28", weekday: "Saturday" },
  { name: "Sip's", barName: "Sip's", date: "2-28", weekday: "Saturday" },
  { name: "Paddy's", barName: "Paddy's", date: "2-28", weekday: "Saturday" },
  { name: "Cy's", barName: "Cy's Bar", date: "2-27", weekday: "Friday" },
  { name: "Outlaw's", barName: "Outlaw's", date: "2-27", weekday: "Friday" },
  { name: "Sip's", barName: "Sip's", date: "2-26", weekday: "Thursday" },
  { name: "Paddy's", barName: "Paddy's", date: "2-26", weekday: "Thursday" },
];

// Group by date
const grouped = PREVIEW_ALBUMS.reduce((acc, album) => {
  const key = album.date;
  if (!acc[key]) acc[key] = { weekday: album.weekday, bars: [] };
  acc[key].bars.push(album);
  return acc;
}, {} as Record<string, { weekday: string; bars: typeof PREVIEW_ALBUMS }>);

function PlaceholderCard({ name }: { name: string }) {
  return (
    <View style={styles.albumCard}>
      <View style={styles.placeholderCover}>
        <FontAwesome name="camera" size={24} color="#2a2a2a" />
      </View>
      <Text style={styles.albumName}>{name}</Text>
    </View>
  );
}

export default function GalleryFallback() {
  return (
    <View style={styles.container}>
      {/* Coming soon banner */}
      <View style={styles.banner}>
        <FontAwesome name="camera" size={14} color={Theme.dark.primary} style={{ marginRight: 8 }} />
        <Text style={styles.bannerText}>
          No photos available yet, but we're working on it!
        </Text>
      </View>

      {/* Grouped placeholder albums matching real gallery layout */}
      {Object.entries(grouped).map(([date, { weekday, bars }]) => (
        <View key={date} style={{ marginBottom: 24 }}>
          <Text style={styles.dateHeader}>{weekday} {date}</Text>
          <View style={styles.albumGrid}>
            {bars.map((album, i) => (
              <PlaceholderCard key={i} name={album.name} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.container.background,
    borderLeftWidth: 3,
    borderLeftColor: Theme.dark.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  bannerText: {
    color: Theme.container.titleText,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  dateHeader: {
    color: Theme.container.titleText,
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 8,
    marginLeft: 4,
  },
  albumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  albumCard: {
    width: "48%",
    margin: "1%",
    backgroundColor: Theme.container.background,
    borderRadius: 12,
    overflow: "hidden",
  },
  placeholderCover: {
    width: "100%",
    height: 140,
    backgroundColor: Theme.dark.black ?? "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  albumName: {
    color: Theme.container.titleText,
    fontSize: 14,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
});