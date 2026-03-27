import React, { useState, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useBarDetail } from "@/hooks/useBarDetail";
import { Theme } from "@/constants/theme";
import ErrorState from "@/components/ui/error-state";
import { MenuSection, MenuItemModal } from "@/components/bars/menu-components";
import { Skeleton } from "@/components/ui/skeleton";

export default function BarMenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { bar, loading } = useBarDetail(id);
  const [activeItem, setActiveItem] = useState<{ name: string; desc: string } | null>(null);

  const MenuSkeleton = () => (
    <View style={{ padding: 16, gap: 20 }}>
      <Skeleton width="50%" height={30} />
      <View style={{ gap: 10 }}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Theme.container.mainBorder }}>
            <View style={{ gap: 6, flex: 1 }}>
              <Skeleton width="40%" height={18} />
              <Skeleton width="70%" height={14} />
            </View>
            <Skeleton width={40} height={18} />
          </View>
        ))}
      </View>
    </View>
  );

  const sections = useMemo(() => {
    if (!bar?.menu?.sections) return [];
    return bar.menu.sections
      .map((section, sIdx) => ({
        id: section.id || `section-${sIdx}`,
        title: section.title || "Menu",
        items: (section.items ?? []).map((item, iIdx) => ({
          ...item,
          id: item.id || `${sIdx}-${iIdx}`,
          name: item.name || "Unnamed Item",
          isAvailable: item.isAvailable ?? true,
        })),
      }))
      .filter((section) => section.items.length > 0);
  }, [bar]);

  // if (loading) return (
  //   <View style={[styles.container, styles.center]}>
  //     <Text style={styles.loading}>Loading menu!</Text>
  //   </View>
  // );

  if (loading) return <MenuSkeleton />;

  if (!bar) return <ErrorState title="Bar not found" subtitle="Please try again later." />;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{bar.name} Menu</Text>

        {sections.length > 0 ? (
          sections.map((sec) => (
            <MenuSection key={sec.id} section={sec} onSelectItem={setActiveItem} />
          ))
        ) : (
          <Text style={styles.empty}>Menu coming soon!</Text>
        )}
      </ScrollView>

      <MenuItemModal item={activeItem} onClose={() => setActiveItem(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background,
    paddingHorizontal: 12,
    paddingTop: 12
  },
  center: {
    justifyContent: "center",
    alignItems: "center"
  },
  loading: {
    color: Theme.container.titleText,
    fontSize: 14
  },
  title: {
    color: Theme.container.titleText,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4
  },
  empty: {
    color: Theme.container.titleText,
    padding: 16, fontSize: 14
  },
});