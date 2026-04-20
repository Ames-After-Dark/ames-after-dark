import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, TouchableWithoutFeedback, StyleSheet, Dimensions, Pressable } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { DealEventModal, DealEventPill } from "@/components/bars/deal-event-modal";
import type { DealOrEventItem } from "@/components/bars/deal-event-modal";
import type { ScheduledDeal, ScheduledEvent } from "@/types/bars";
import { Theme } from '@/constants/theme';
import { Bar } from '@/utils/bar-assets';

import MapView, { Marker } from "react-native-maps";
import { Modal, ActivityIndicator } from "react-native";

const { width, height } = Dimensions.get("window");

interface BarHeaderProps {
  bar: Bar;
  assets: any;
  openNow: boolean;
  statusText?: string;
}

interface BarMapModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenInMaps: () => void;
  onOpenInAppleMaps: () => void;
  mapData: any;
  barName?: string;
}

interface BarGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenGallery: () => void;
  assets: any;
  barName?: string;
  latestImage?: string | null;
  hasSpecificAlbum?: boolean;
  isLoading?: boolean;
}

export const BarMapModal = ({ visible, onClose, onOpenInMaps, onOpenInAppleMaps, mapData, barName }: BarMapModalProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={() => { }}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeIconBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="close" size={16} color="white" />
            </TouchableOpacity>

            {mapData && Number.isFinite(mapData.latitude) && Number.isFinite(mapData.longitude) ? (
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

                <View style={styles.overlayFooter}>
                  <View style={styles.primaryActionsRow}>
                    <TouchableOpacity style={styles.openInMapsBtn} onPress={onOpenInMaps}>
                      <FontAwesome name="map" size={18} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.openInMapsText}>In-App Map</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.openInAppleMapsBtn} onPress={onOpenInAppleMaps}>
                      <FontAwesome name="location-arrow" size={18} color="white" style={{ marginRight: 8 }} />
                      <Text style={styles.openInMapsText}>Apple Maps</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : mapData ? (
              <View style={styles.loadingContainer}>
                <FontAwesome name="map-marker" size={28} color={Theme.dark.error} />
                <Text style={styles.loadingText}>Location unavailable for {barName}.</Text>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.dark.primary} />
                <Text style={styles.loadingText}>Locating {barName}...</Text>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

export const BarGalleryModal = ({ visible, onClose, onOpenGallery, assets, barName, latestImage, hasSpecificAlbum, isLoading  }: BarGalleryModalProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableWithoutFeedback onPress={() => { }}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeIconBtn} onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <FontAwesome name="close" size={16} color="white" />
            </TouchableOpacity>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Theme.dark.primary} />
                <Text style={styles.loadingText}>Checking for recent photos...</Text>
              </View>
            ) : (
              <>
              <Image source={latestImage ? { uri: latestImage } : assets?.cover} style={styles.galleryPreviewImage} />

              <View style={styles.overlayFooter}>
                <Text style={styles.galleryModalTitle}>
                  {hasSpecificAlbum ? `${barName}'s Gallery` : "Ames After Dark Gallery"}
                </Text>
                <Text style={styles.galleryModalText}>
                  {hasSpecificAlbum
                    ? `Check out the latest photos from ${barName}! Tap below to explore the full album.`
                    : `Dive into the city's nightlife gallery. Check out the latest photos from around town!`}
                </Text>

                <View style={styles.primaryActionsRow}>
                  <TouchableOpacity style={styles.openInMapsBtn} onPress={onOpenGallery}>
                    <FontAwesome name="image" size={18} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.openInMapsText}>Enter Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
            )}

            

          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  </Modal>
);

export const BarHeader = ({ bar, assets, openNow, statusText }: BarHeaderProps) => (
  <View>
    <Image source={assets.cover} style={styles.coverPhoto} resizeMode="cover" />
    <View style={styles.headerRow}>
      <Image source={assets.logo} style={styles.barImage} />
      <View style={{ flex: 1 }}>
        <Text style={styles.barName}>{bar.name}</Text>
        <Text style={styles.barDescription}>{bar.description}</Text>
        <View style={[
          styles.statusPill,
          { backgroundColor: openNow ? Theme.dark.success : Theme.dark.error }
        ]}>
          <Text style={styles.statusPillText}>{statusText ?? (openNow ? "Open" : "Closed")}</Text>
        </View>
      </View>
    </View>
  </View>
);

export const DealEventSection = ({
  title,
  items,
  emptyText,
  barName,
  barId,
}: {
  title: string;
  items: DealOrEventItem[];
  emptyText: string;
  barName: string;
  barId: string;
}) => {
  const [selectedItem, setSelectedItem] = useState<DealOrEventItem | null>(null);

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {items.length === 0 ? (
        <Text style={styles.sectionEmpty}>{emptyText}</Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [styles.dealCard, pressed && { opacity: 0.75 }]}
            onPress={() => setSelectedItem(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.dealTitle} numberOfLines={1}>{item.title}</Text>
              {item.startTime ? (
                <Text style={styles.dealTime}>{item.startTime}</Text>
              ) : null}
            </View>
            <DealEventPill kind={item.kind} />
            <Ionicons name="chevron-forward" size={16} color="#6B7280" />
          </Pressable>
        ))
      )}

      <DealEventModal
        item={selectedItem}
        barName={barName}
        barId={barId}
        onClose={() => setSelectedItem(null)}
        // No onBarPress — already on the bar page
      />
    </View>
  );
};

export const BottomCard = ({ title, image, onPress }: { title: string, image: any, onPress: () => void }) => (
  <TouchableOpacity style={styles.bottomCard} onPress={onPress}>
    <View style={styles.bottomCardHeader}>
      <Text style={styles.bottomCardTitle}>{title}</Text>
      <FontAwesome name="expand" size={16} color="white" />
    </View>
    <Image source={image} style={styles.bottomCardImage} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  coverPhoto: {
    width: "100%",
    height: 180
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16
  },
  barImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 12
  },
  barName: {
    color: Theme.container.titleText,
    fontSize: 20,
    fontWeight: "700"
  },
  barDescription: {
    color: Theme.container.titleText,
    fontSize: 14
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 6
  },
  statusPillText: {
    color: Theme.container.background,
    fontSize: 10,
    fontWeight: "800"
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    marginHorizontal: 12
  },
  statBox: {
    alignItems: "center"
  },
  statNumber: {
    color: Theme.container.titleText,
    fontSize: 18,
    fontWeight: "700"
  },
  statLabel: {
    color: Theme.container.titleText,
    fontSize: 12
  },
  sectionContainer: {
    backgroundColor: Theme.container.background,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 12,
    marginVertical: 6
  },
  sectionTitle: {
    color: Theme.container.titleText,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6
  },
  sectionItem: {
    color: Theme.container.titleText,
    fontSize: 14,
    marginVertical: 2
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    margin: 12
  },
  bottomCard: {
    flex: 1,
    borderRadius: 12,
    marginHorizontal: 4,
    padding: 8
  },
  bottomCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  bottomCardTitle: {
    color: Theme.container.titleText,
    fontSize: 16,
    fontWeight: "600"
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
  closeIconBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    zIndex: 5,
  },
  overlayMap: {
    flex: 1,
  },
  overlayFooter: {
    padding: 15,
    backgroundColor: Theme.container.background,
  },
  primaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  openInMapsBtn: {
    backgroundColor: Theme.dark.primary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openInAppleMapsBtn: {
    backgroundColor: Theme.dark.secondary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    flex: 1,
    minWidth: 0,
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
  galleryPreviewImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover',
  },
  galleryModalTitle: {
    color: Theme.container.titleText,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  galleryModalText: {
    color: Theme.container.titleText,
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 15,
  },
  sectionEmpty: {
    color: Theme.container.inactiveText,
    fontSize: 14,
    fontStyle: "italic",
    marginTop: 2,
  },
  dealCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  dealTitle: {
    color: Theme.container.titleText,
    fontSize: 14,
    fontWeight: "700",
  },
  dealTime: {
    color: Theme.container.inactiveText,
    fontSize: 12,
    marginTop: 2,
  },
});