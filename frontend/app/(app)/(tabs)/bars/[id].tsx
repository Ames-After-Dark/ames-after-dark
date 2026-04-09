import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet, Text, RefreshControl, Linking, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { useBarDetail } from "@/hooks/useBarDetail";
import { fetchLocationById, MapLocation } from "@/services/locationService";
import { getNow, isActive, isBarOpen } from "@/utils/schedule";
import { Theme } from '@/constants/theme';
import ErrorState from "@/components/ui/error-state";
import { getLatestWeekAlbums, Album } from "@/services/galleryService";

import {
  BarHeader,
  // BarStats, 
  InfoSection,
  BottomCard,
  BarMapModal,
  BarGalleryModal
} from "@/components/bars/bar-detail-components";
import { getBarAssets } from "@/utils/bar-assets";
import { Skeleton } from "@/components/ui/skeleton";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BarProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [mapData, setMapData] = useState<MapLocation | null>(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  const toggleMapOverlay = () => setIsMapVisible(!isMapVisible);

  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const toggleGalleryOverlay = () => setIsGalleryVisible(!isGalleryVisible);
  const [latestGalleryImage, setLatestGalleryImage] = useState<string | null>(null);
  const [specificAlbum, setSpecificAlbum] = useState<Album | null>(null);

  const navigateToGallery = () => {
    setIsGalleryVisible(false);
    if (specificAlbum) {
      router.replace(`/gallery/${id}?albumUri=${encodeURIComponent(specificAlbum.albumUri)}&barName=${encodeURIComponent(bar?.name || '')}` as any);
    } else {
      router.replace("/gallery" as any);
    }
  };

  const { bar, loading, refetch } = useBarDetail(id);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  // Height of the global TopHeader — must match TopHeader.tsx constants
  const HEADER_SPACER = insets.top + 44;

  useEffect(() => {
    const fetchLatestGalleryImage = async () => {
      try {
        const albums = await getLatestWeekAlbums();

        if (albums && albums.length > 0) {
          const nameMap: Record<string, string> = {
            "Cy's Roost": "Cy's",
            "Outlaws": "Outlaw's",
            "Sips": "Sip's",
            "Paddy's Irish Pub": "Paddy's"
          };
          const searchName = nameMap[bar?.name || ""] || bar?.name;
          const matchingAlbum = albums.find(a => a.barName === searchName);

          if (matchingAlbum) {
            setSpecificAlbum(matchingAlbum);
            setLatestGalleryImage(matchingAlbum.coverUrl);
          } else {
            setSpecificAlbum(null);
            setLatestGalleryImage(null);
          }
        }
      } catch (err) {
        console.log("Could not fetch latest gallery image, falling back to bar cover.");
      }
    };

    if (bar?.name) {
      fetchLatestGalleryImage();
    }
  }, [bar?.name]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (refetch) refetch();
    }, 60000);
    return () => clearInterval(interval);
  }, [refetch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refetch) await refetch();
      if (id) {
        const data = await fetchLocationById(id);
        setMapData(data);
      }
      console.log("Bar page refreshed");
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [id, refetch, setMapData]);

  useEffect(() => {
    if (id) fetchLocationById(id).then(setMapData);
  }, [id]);

  const navigateToInternalMap = () => {
    setIsMapVisible(false);
    router.replace({
      pathname: "/(app)/(tabs)/map",
      params: { selectedId: id, focusToken: String(Date.now()) }
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

  const openLocationModal = () => {
    if (!mapData || !Number.isFinite(mapData.latitude) || !Number.isFinite(mapData.longitude)) {
      Alert.alert("Location unavailable", "This location does not have map coordinates yet.");
      return;
    }
    setIsMapVisible(true);
  };

  if (loading) return (
    <View style={styles.container}>
      {/* Spacer so skeleton content clears the global TopHeader */}
      <View style={{ height: HEADER_SPACER }} />
      <Skeleton width="100%" height={180} borderRadius={0} />
      <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
        <Skeleton width={70} height={70} borderRadius={12} />
        <View style={{ marginLeft: 12, flex: 1, gap: 8 }}>
          <Skeleton width="70%" height={24} />
          <Skeleton width="90%" height={16} />
          <Skeleton width={60} height={20} borderRadius={20} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <Skeleton width="100%" height={100} borderRadius={12} />
        <Skeleton width="100%" height={100} borderRadius={12} />
      </View>
    </View>
  );

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

  return (
    <>
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
        {/* Pushes all content below the globally-mounted TopHeader */}
        <View style={{ height: HEADER_SPACER }} />

        <BarHeader bar={bar} assets={assets} openNow={openNow} statusText={statusText} />

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
            onPress={openLocationModal}
          />
          <BottomCard
            title="Gallery"
            image={assets.gallery}
            onPress={() => setIsGalleryVisible(true)}
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

      <BarGalleryModal
        visible={isGalleryVisible}
        onClose={toggleGalleryOverlay}
        onOpenGallery={navigateToGallery}
        assets={assets}
        barName={bar?.name}
        latestImage={latestGalleryImage}
        hasSpecificAlbum={!!specificAlbum}
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
