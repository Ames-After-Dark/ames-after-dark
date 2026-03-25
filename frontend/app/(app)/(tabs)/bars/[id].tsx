import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Text, RefreshControl, Linking, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import { useBarDetail } from "@/hooks/useBarDetail";
import { fetchLocationById, MapLocation } from "@/services/locationService";
import { getNow, isActive, isBarOpen } from "@/utils/schedule";
import { Theme } from '@/constants/theme';
import ErrorState from "@/components/ui/error-state";

import {
  BarHeader,
  // BarStats, 
  InfoSection,
  BottomCard,
  BarMapModal
} from "@/components/bars/bar-detail-components";
import { getBarAssets } from "@/utils/bar-assets";
import { Skeleton } from "@/components/ui/skeleton";
import { useFavorites } from '@/context/FavoritesContext';

export default function BarProfile() {
  const { id, backTo } = useLocalSearchParams<{ id: string; backTo?: string }>();
  const router = useRouter();
  // const { bar, loading } = useBarDetail(id);

  const [mapData, setMapData] = useState<MapLocation | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  const toggleMapOverlay = () => setIsMapVisible(!isMapVisible);


  const { bar, loading, refetch } = useBarDetail(id);
  const [refreshing, setRefreshing] = useState(false);
  // const [mapData, setMapData] = useState<MapLocation | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (refetch) refetch();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [refetch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. Refresh bar details (Open/Closed status, stats, etc.)
      if (refetch) {
        await refetch();
      }

      // 2. Refresh map data
      if (id) {
        const data = await fetchLocationById(id);
        setMapData(data); // This is the function causing the error
      }

      console.log("Bar page refreshed");
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
    // Add ALL external variables used inside the function to this array
  }, [id, refetch, setMapData]);

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
      {/* <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginVertical: 20 }}>
        <Skeleton width={80} height={40} />
        <Skeleton width={80} height={40} />
        <Skeleton width={80} height={40} />
      </View> */}

      {/* Section Blocks */}
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <Skeleton width="100%" height={100} borderRadius={12} />
        <Skeleton width="100%" height={100} borderRadius={12} />
      </View>
    </View>
  );

  const { isFavorited, toggleFavorite } = useFavorites();
  const barIdNumeric = Number(id);

  const navigateToInternalMap = () => {
    setIsMapVisible(false);

    router.push({
      pathname: "/(app)/(tabs)/map",
      params: { selectedId: id }
    });
  };

  const openInAppleMaps = async () => {
    if (!mapData?.latitude || !mapData?.longitude) {
      Alert.alert("Location unavailable", "We couldn't find coordinates for this location yet.");
      return;
    }

    const lat = mapData.latitude;
    const lng = mapData.longitude;
    const query = encodeURIComponent(bar?.name ?? "Bar");
    const appleMapsUrl = `https://maps.apple.com/?ll=${lat},${lng}&q=${query}`;

    try {
      await Linking.openURL(appleMapsUrl);
    } catch {
      Alert.alert("Unable to open Apple Maps", "Please try again in a moment.");
    }
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

  const openNow = isBarOpen(
    {
      openingTime: bar.openingTime,
      closingTime: bar.closingTime,
      status: bar.status ?? (bar.open ? "Open" : "Closed"),
    },
    now
  );
  const statusText = openNow
    ? (bar.closingTime ? `Open • Closes at ${bar.closingTime}` : "Open")
    : (bar.openingTime ? `Closed • Opens at ${bar.openingTime}` : "Closed");

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
        ),

        headerRight: () => (
          <TouchableOpacity
            onPress={() => toggleFavorite(barIdNumeric)}
            style={{ paddingHorizontal: 16 }}
          >
            <FontAwesome
              name={isFavorited(barIdNumeric) ? "star" : "star-o"}
              size={22}
              color={isFavorited(barIdNumeric) ? Theme.dark.tertiary : Theme.dark.secondary}
            />
          </TouchableOpacity>
        )
      }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Theme.dark.primary}
            colors={[Theme.dark.primary]}
          />
        }
      >
        <BarHeader bar={bar} assets={assets} openNow={openNow} statusText={statusText} />

        {/* <BarStats bar={bar} /> */}

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
        onOpenInAppleMaps={openInAppleMaps}
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