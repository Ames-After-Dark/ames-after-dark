import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Text, RefreshControl } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import { useBarDetail } from "@/hooks/useBarDetail";
import { fetchLocationById, MapLocation } from "@/services/locationService";
import { formatTime, getNow, isActive, isBarOpen } from "@/utils/schedule";
import { Theme } from '@/constants/theme';
import ErrorState from "@/components/ui/error-state";
import { getBarStatus } from "@/utils/schedule";

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

  // const closingTime = bar ? getClosingTime(bar) : null;
  // const status = useMemo(() => getBarStatus(bar), [bar]);

  console.log("DEBUG: Component Rendered. Bar Data exists:", !!bar);

  // const status = useMemo(() => {
  //   console.log("INTERNAL MEMO CHECK - bar name:", bar?.name);

  //   if (!bar || !bar.location_hours) {
  //     console.log("MEMO EXIT: Bar data or hours missing", {
  //       hasBar: !!bar,
  //       hasHours: !!bar?.location_hours
  //     });
  //     return { isOpen: false, closingTime: null };
  //   }

  //   // 3. CALL THE FUNCTION
  //   const result = getBarStatus(bar);
  //   console.log("MEMO RESULT:", result);
  //   return result;
  // }, [bar]);

  // The logic to extract current status and times dynamically
  const scheduleStatus = useMemo(() => {
    // 1. Safety check for loading state
    if (!bar || !bar.hours) {
      return { closingTime: null, openingTime: null, isOpen: false };
    }

    const now = getNow();
    // JS getDay(): 0=Sun, 1=Mon... 2=Tue. 
    // If your DB uses 1=Mon... 7=Sun, we adjust:
    const currentDayId = now.getDay() === 0 ? 7 : now.getDay();

    // 2. Find today's specific schedule entry
    const todayHours = bar.hours.find((h: any) => h.day_id === currentDayId);

    if (!todayHours) {
      return { closingTime: null, openingTime: null, isOpen: false };
    }

    // 3. Use your existing utility to check status
    const isOpen = isBarOpen(bar, now);

    // 4. Format the raw strings (e.g., "23:59:00") into "11:59 PM"
    const closingTime = formatTime(todayHours.close_time);
    const openingTime = formatTime(todayHours.open_time);

    return { closingTime, openingTime, isOpen };
  }, [bar]);

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

  useEffect(() => {
    if (id) fetchLocationById(id).then(setMapData);
  }, [id]);

  if (loading) return <ProfileSkeleton />;

  if (!bar) return <ErrorState title="Bar not found" subtitle="Please try again later." />;

  const assets = getBarAssets(bar);
  const now = getNow();
  const activeDeals = bar.dealsScheduled?.filter(d => isActive(d.rule, now)) ?? [];
  const activeEvents = bar.eventsScheduled?.filter(e => isActive(e.rule, now)) ?? [];

  // const openNow = bar.open ?? false;

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
        <BarHeader
          bar={bar}
          assets={assets}
          openNow={scheduleStatus.isOpen}
          currentOpeningTime={scheduleStatus.openingTime}
          currentClosingTime={scheduleStatus.closingTime}
        />

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