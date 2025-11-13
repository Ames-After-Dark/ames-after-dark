// app/bars/[id]/menu.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useBarDetail } from "@/hooks/useBarDetail";
import { Stack } from "expo-router";
import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";


export default function BarMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { bar, loading } = useBarDetail(id);
  const navigation = useNavigation();
  const sections = bar?.menu?.sections ?? [];

  useLayoutEffect(() => {
    // remove the default header title
    navigation.setOptions({
      title: "", // clears "[id]"
      headerStyle: { backgroundColor: "#0b0b12" },
      headerTintColor: "#33CCFF",
      headerTitleStyle: { color: "#33CCFF" },
      headerBackTitle: "",
    });
  }, [navigation]);

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
    
    <>
      <Stack.Screen
        options={{
          title: "", // removes “[id]”
          headerStyle: { backgroundColor: "#0b0b12" },
          headerTintColor: "#33CCFF",       // back arrow + back label
          headerTitleStyle: { color: "#33CCFF" }, // title color (if you set one)
        }}
      />
  
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b12", paddingHorizontal: 12, paddingTop: 12 },
  center: { justifyContent: "center", alignItems: "center" },
  loading: { color: "white" },
  title: { color: "white", fontSize: 22, fontWeight: "800", marginBottom: 4 },
  subtle: { color: "#9CA3AF", marginBottom: 12 },
  empty: { color: "white", padding: 16 },
  section: { backgroundColor: "#1A1A1A", borderRadius: 12, padding: 12, marginVertical: 6 },
  sectionTitle: { color: "white", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 8, gap: 8 },
  itemName: { color: "white", fontSize: 16, fontWeight: "600" },
  itemDesc: { color: "#E5E7EB", fontSize: 13, marginTop: 2 },
  itemPrice: { color: "#33CCFF", fontWeight: "700", marginLeft: 8 },
});
