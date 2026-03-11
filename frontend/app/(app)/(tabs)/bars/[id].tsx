// app/bars/[id].tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter, } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

import MapView, { Marker } from "react-native-maps";
import { fetchLocationById } from "@/services/locationService";
import { MapLocation } from "@/services/locationService";

import { useBarDetail } from "@/hooks/useBarDetail";
// import { getNow, isActive, isBarOpen } from "@/config/time";
import { shouldForceErrorPage } from "@/utils/dev-error-pages";
import { IMG } from "@/assets/assets"; // ✅ placeholder fallbacks  ../../../../assets/assets.ts
import ErrorState from "@/components/ui/error-state";
import { getNow, isActive, isBarOpen } from "@/utils/schedule";

import { Theme } from '@/constants/theme';

const { width, height } = Dimensions.get("window");

// Map bar names to cover images
const barCoverMap: { [key: string]: any } = {
  "AJ's Ultralounge": IMG.CysCover,
  "BNC Fieldhouse": IMG.BaseCover,
  "Cy's Roost": IMG.CysCover2,
  "Welch Ave Station": IMG.PaddysCover,
  "The Blue Owl Bar": IMG.BaseCover,
  "Paddy's Irish Pub": IMG.SipsPaddysCover2,
  "Sips": IMG.SipsCover,
  "Mickey's Irish Pub": IMG.BaseCover,
  "Outlaws": IMG.OutlawsCover,
};

// Map bar names to logos
const barLogoMap: { [key: string]: any } = {
  "AJ's Ultralounge": IMG.AJs,
  "BNC Fieldhouse": IMG.bnc,
  "Cy's Roost": IMG.CysRoost,
  "Welch Ave Station": IMG.Welch,
  "The Blue Owl Bar": IMG.BlueOwl,
  "Paddy's Irish Pub": IMG.Paddys,
  "Sips": IMG.Sips,
  "Mickey's Irish Pub": IMG.Mickey,
  "Outlaws": IMG.Outlaws,
};

export default function BarProfile() {
  const { id, backTo } = useLocalSearchParams<{
    id: string;
    backTo?: "home" | "bars" | "map" | "tonight-open" | "tonight-deals";
  }>();
  const router = useRouter();
  const { bar, loading } = useBarDetail(id);
  const now = getNow();

  const [isMapVisible, setIsMapVisible] = useState(false);
  const [barCoords, setBarCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const [mapData, setMapData] = useState<MapLocation | null>(null);

  useEffect(() => {

    if (!id) return;

    const loadMapData = async () => {
      const data = await fetchLocationById(id);
      setMapData(data);
    };
    if (id) loadMapData();
  }, [id]);

  const handleBack = () => {
    if (backTo === "home") {
      router.replace("/(app)/(tabs)/tonight");
      return;
    }

    if (backTo === "tonight-open") {
      router.replace({
        pathname: "/(app)/(tabs)/tonight",
        params: { tab: "open" },
      });
      return;
    }

    if (backTo === "tonight-deals") {
      router.replace({
        pathname: "/(app)/(tabs)/tonight",
        params: { tab: "deals" },
      });
      return;
    }

    if (backTo === "map") {
      router.replace("/(app)/(tabs)/map");
      return;
    }

    router.replace("/(app)/(tabs)/bars");
    // If TypeScript complains, you can do:
    // router.replace("/(app)/(tabs)/bars" as any);
  };

  const toggleMapOverlay = () => setIsMapVisible(!isMapVisible);

  const navigateToInternalMap = () => {
    setIsMapVisible(false);
    // Navigates to your map tab and passes the ID to select this bar
    router.push({
      pathname: "/(app)/(tabs)/map",
      params: { selectedId: id }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={Theme.dark.primary} />
      </View>
    );
  }

  if (!bar || shouldForceErrorPage("barDetail")) {
    return (
      <View style={styles.container}>
        <ErrorState title="Bar not found" subtitle="Please try again later." />
      </View>
    );
  }

  // ---- Active items (respect schedules) ----
  const activeDeals = bar.dealsScheduled?.filter(d => isActive(d.rule, now)) ?? [];
  const activeEvents = bar.eventsScheduled?.filter(e => isActive(e.rule, now)) ?? [];
  // const openNow = isBarOpen(bar, now);
  const openNow = bar.open ?? false;

  // ---- Image sources (use mock maps first, then URL, then mock require, then placeholder) ----
  const coverSrc =
    barCoverMap[bar.name] ? barCoverMap[bar.name] :
      bar.coverUrl ? { uri: bar.coverUrl } :
        bar.cover ? bar.cover :
          IMG.LOGO;

  const logoSrc =
    barLogoMap[bar.name] ? barLogoMap[bar.name] :
      bar.logoUrl ? { uri: bar.logoUrl } :
        bar.logo ? bar.logo :
          IMG.LOGO;

  const mapSrc =
    bar.mapImageUrl ? { uri: bar.mapImageUrl } :
      bar.mapImage ? bar.mapImage :
        IMG.MAP ?? IMG.LOGO;

  const gallerySrc =
    bar.galleryImageUrl ? { uri: bar.galleryImageUrl } :
      bar.galleryImage ? bar.galleryImage :
        IMG.GALLERY ?? IMG.LOGO;

  return (
    <>
      <Stack.Screen
        options={{
          title: "",
          headerLeft: () => (
            <TouchableOpacity
              onPress={handleBack}
              style={{ paddingHorizontal: 12 }}
            >
              <FontAwesome
                name="chevron-left"
                size={20}
                color={Theme.dark.secondary}
              />
            </TouchableOpacity>
          ),
        }}
      />
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
                {
                  backgroundColor: openNow
                    ? Theme.dark.success
                    : Theme.container.inactiveText
                },
              ]}
            >
              <Text style={styles.statusPillText}>
                {/* {openNow ? `Open until ${bar.closingTime ?? ""}` : "Closed"} */}
                {openNow ? `Open` : "Closed"}
              </Text>
            </View>
          </View>

          <TouchableOpacity /* TODO: hook to POST /favorite later */>
            <FontAwesome
              name="star"
              size={24}
              color={bar.favorite ? Theme.dark.tertiary : Theme.search.inactiveInput}
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
            onPress={() =>
              router.push({
                pathname: "/bars/menu",
                params: { id },
              })
            }

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

          <TouchableOpacity style={styles.bottomCard} onPress={toggleMapOverlay}>
            <View style={styles.bottomCardHeader}>
              <Text style={styles.bottomCardTitle}>Location</Text>
              <FontAwesome name="expand" size={16} color="white" />
            </View>
            <Image source={mapSrc} style={styles.bottomCardImage} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.bottomCard} onPress={() => router.push("/gallery")}>
            <View style={styles.bottomCardHeader}>
              <Text style={styles.bottomCardTitle}>Gallery</Text>
              <FontAwesome name="expand" size={16} color="white" />
            </View>
            <Image source={gallerySrc} style={styles.bottomCardImage} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Map Overlay Modal */}
      <Modal visible={isMapVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {mapData ? (
              <>
                <MapView
                  style={styles.overlayMap}
                  showsPointsOfInterest={false}
                  initialRegion={{
                    latitude: mapData.latitude,
                    longitude: mapData.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker coordinate={{ latitude: mapData.latitude, longitude: mapData.longitude }}>
                    <View style={styles.customPinContainer}>
                      <Image source={mapData.logo} style={styles.customPinImage} />
                    </View>
                  </Marker>
                </MapView>

                {/* Footer containing the buttons */}
                <View style={styles.overlayFooter}>
                  <TouchableOpacity style={styles.closeBtn} onPress={toggleMapOverlay}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.openInMapsBtn} onPress={navigateToInternalMap}>
                    {/* Add the icon here */}
                    <FontAwesome
                      name="map"
                      size={18}
                      color="white"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.openInMapsText}>Open</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.dark.primary} />
                <Text style={styles.loadingText}>Locating {bar?.name}...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    marginTop: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Theme.dark.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButtonText: {
    color: Theme.dark.white,
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  container: {
    flex: 1,
    backgroundColor: Theme.dark.background
  },
  center: { justifyContent: "center", alignItems: "center" },
  coverPhoto: { width: "100%", height: 180 },

  headerRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  barImage: { width: 70, height: 70, borderRadius: 12, marginRight: 12 },
  barName: {
    color: Theme.container.titleText, // "white",
    fontSize: 20,
    fontWeight: "700"
  },
  barDescription: {
    color: Theme.container.titleText, // "white",
    fontSize: 14
  },

  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  statusPillText: {
    color: Theme.container.background, // "#0b0c12",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4
  },

  statsRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, marginHorizontal: 12 },
  statBox: { alignItems: "center" },
  statNumber: {
    color: Theme.container.titleText, // "white",
    fontSize: 18,
    fontWeight: "700"
  },
  statLabel: {
    color: Theme.container.titleText, // "white",
    fontSize: 12
  },

  sectionContainer: {
    backgroundColor: Theme.container.background, // "#1A1A1A",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6
  },
  sectionTitle: {
    color: Theme.container.titleText, // "white",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6
  },
  sectionItem: {
    color: Theme.container.titleText, // "#E5E5E5",
    fontSize: 14,
    marginVertical: 2
  },

  bottomRow: { flexDirection: "row", justifyContent: "space-around", margin: 12 },
  bottomCard: { flex: 1, borderRadius: 12, marginHorizontal: 4, padding: 8 },
  bottomCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  bottomCardTitle: {
    color: Theme.container.titleText, // "white",
    fontSize: 16,
    fontWeight: "600"
  },
  bottomCardArrow: {
    color: Theme.container.titleText, // "white",
    fontSize: 18,
    fontWeight: "800"
  },
  bottomCardImage: {
    width: "100%",
    height: 100,
    borderRadius: 8
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    height: height * 0.6,
    backgroundColor: Theme.dark.background,
    borderRadius: 20,
    overflow: 'hidden',
  },
  overlayMap: {
    flex: 1,
  },
  overlayFooter: {
    flexDirection: 'row',
    padding: 15,
    justifyContent: 'space-between',
    backgroundColor: Theme.container.background,
  },
  closeBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.dark.error,
  },
  closeBtnText: { color: 'white' },
  openInMapsBtn: {
    backgroundColor: Theme.dark.primary,
    paddingVertical: 10,
    paddingHorizontal: (width / 2) - 100,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openInMapsText: { 
    color: 'white', 
    fontWeight: '700' 
  },
  customPinContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: Theme.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  customPinImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Theme.dark.background,
  },
  loadingText: {
    marginTop: 12,
    color: Theme.container.titleText,
    fontSize: 14,
    opacity: 0.7,
    fontWeight: '500',
  },
});
