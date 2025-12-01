// app/(tabs)/bars/menu.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useBarDetail } from "@/hooks/useBarDetail";
import { Theme } from "@/constants/theme";

export default function BarMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bar, loading } = useBarDetail(id);
  const sections = bar?.menu?.sections ?? [];

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loading}>Loading menu…</Text>
      </View>
    );
  }

  if (!bar) {
    return (
      <View style={styles.container}>
        <Text style={styles.empty}>Bar not found.</Text>
      </View>
    );
  }

  if (!sections.length) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{bar.name} Menu</Text>
        <Text style={styles.empty}>Menu coming soon.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 48 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{bar.name} Menu</Text>
      {bar.menu?.updatedAt ? (
        <Text style={styles.subtle}>Updated {bar.menu.updatedAt}</Text>
      ) : null}

      {sections.map((sec) => (
        <View key={sec.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{sec.title}</Text>
          {sec.items.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{it.name}</Text>
                {it.desc ? <Text style={styles.itemDesc}>{it.desc}</Text> : null}
              </View>
              {it.price ? <Text style={styles.itemPrice}>{it.price}</Text> : null}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loading: {
    color: Theme.container.titleText,
    fontSize: 14,
  },
  title: {
    color: Theme.container.titleText,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtle: {
    color: Theme.container.inactiveText,
    marginBottom: 12,
    fontSize: 12,
  },
  empty: {
    color: Theme.container.titleText,
    padding: 16,
    fontSize: 14,
  },
  section: {
    backgroundColor: Theme.container.background,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Theme.container.mainBorder,
  },
  sectionTitle: {
    color: Theme.container.titleText,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    gap: 8,
  },
  itemName: {
    color: Theme.container.titleText,
    fontSize: 16,
    fontWeight: "600",
  },
  itemDesc: {
    color: Theme.search.input,
    fontSize: 13,
    marginTop: 2,
  },
  itemPrice: {
    color: Theme.dark.secondary,
    fontWeight: "700",
    marginLeft: 8,
    fontSize: 14,
  },
});
