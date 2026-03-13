import React, { useState, useEffect } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import { useBarDetail } from "@/hooks/useBarDetail";
import { fetchLocationById, MapLocation } from "@/services/locationService";
import { getNow, isActive } from "@/utils/schedule";
import { Theme } from '@/constants/theme';
import ErrorState from "@/components/ui/error-state";

import {
  BarHeader,
  BarStats, InfoSection, BottomCard, BarMapModal
} from "@/components/bars/bar-detail-components";
import { getBarAssets } from "@/utils/bar-assets";
import { Skeleton } from "@/components/ui/skeleton";

export default function BarProfile() {
  const { id, backTo } = useLocalSearchParams<{ id: string; backTo?: string }>();
  const router = useRouter();
  const { bar, loading } = useBarDetail(id);

  const [mapData, setMapData] = useState<MapLocation | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  const toggleMapOverlay = () => setIsMapVisible(!isMapVisible);

  // Inside app/bars/[id].tsx

  const ProfileSkeleton = () => (
    <View style={styles.container}>
      {/* Cover Photo */}
      <Skeleton width="100%" height={180} borderRadius={0} />

      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Skeleton width={70} height={70} borderRadius={12} />
        <View style={{ marginLeft: 12, flex: 1, gap: 8 }}>
          <Skeleton width="70%" height={24} />
          <Skeleton width="90%" height={16} />
          <Skeleton width={60} height={20} borderRadius={20} />
        </View>
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 }}>
        <Skeleton width={80} height={40} />
        <Skeleton width={80} height={40} />
        <Skeleton width={80} height={40} />
      </View>

      {/* Section Blocks */}
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <Skeleton width="100%" height={100} borderRadius={12} />
        <Skeleton width="100%" height={100} borderRadius={12} />
      </View>
    </View>
  );

  const navigateToInternalMap = () => {
    setIsMapVisible(false);

    router.push({
      pathname: "/(app)/(tabs)/map",
      params: { selectedId: id }
    });
  };

  useEffect(() => {
    if (id) fetchLocationById(id).then(setMapData);
  }, [id]);

  if (loading) return <ProfileSkeleton />;

  if (!bar) return <ErrorState title="Bar not found" subtitle="Please try again later." />;

  const assets = getBarAssets(bar);
  const now = getNow();
  const activeDeals = bar.dealsScheduled?.filter(d => isActive(d.rule, now)) ?? [];
  const activeEvents = bar.eventsScheduled?.filter(e => isActive(e.rule, now)) ?? [];

  const openNow = bar.open ?? false;

  const handleBack = () => {
    if (backTo === "home") router.replace("/(app)/(tabs)/tonight");
    else if (backTo?.startsWith("tonight")) {
      const tab = backTo.split('-')[1];
      router.replace({ pathname: "/(app)/(tabs)/tonight", params: { tab } });
    }
    else if (backTo === "map") router.replace("/(app)/(tabs)/map");
    else router.replace("/(app)/(tabs)/bars");
  };

  return (
    <>
      <Stack.Screen options={{
        title: "",
        headerLeft: () => (
          <TouchableOpacity onPress={handleBack} style={{ paddingHorizontal: 12 }}>
            <FontAwesome name="chevron-left" size={20} color={Theme.dark.secondary} />
          </TouchableOpacity>
        )
      }} />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        <BarHeader bar={bar} assets={assets} openNow={openNow} />

        <BarStats bar={bar} />

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => router.push({ pathname: "/bars/menu", params: { id } })}
        >
          <Text style={styles.menuButtonText}>View Menu</Text>
        </TouchableOpacity>

        <InfoSection title="Current Events" items={activeEvents} emptyText="No active events." />
        <InfoSection title="Deals" items={activeDeals} emptyText="No active deals." />

        <View style={styles.bottomRow}>
          <BottomCard
            title="Location"
            image={assets.map}
            onPress={() => setIsMapVisible(true)}
          />
          <BottomCard
            title="Gallery"
            image={assets.gallery}
            onPress={() => router.push("/gallery")}
          />
        </View>
      </ScrollView>

      <BarMapModal
        visible={isMapVisible}
        onClose={toggleMapOverlay}
        onOpenInMaps={navigateToInternalMap}
        mapData={mapData}
        barName={bar?.name}
      />

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.dark.background
  },
  menuButton: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Theme.dark.secondary,
    alignItems: "center"
  },
  menuButtonText: {
    color: Theme.dark.white,
    fontWeight: "700",
    fontSize: 14
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    margin: 12
  },
});