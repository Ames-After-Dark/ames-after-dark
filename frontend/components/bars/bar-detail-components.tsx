import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";
import { Theme } from '@/constants/theme';
import { Bar } from '@/utils/bar-assets';

import MapView, { Marker } from "react-native-maps";
import { Modal, ActivityIndicator } from "react-native";

const { width, height } = Dimensions.get("window");

interface BarHeaderProps {
  bar: Bar;
  assets: any;
  openNow: boolean;
}

interface BarMapModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenInMaps: () => void;
  mapData: any;
  barName?: string;
}

export const BarMapModal = ({ visible, onClose, onOpenInMaps, mapData, barName }: BarMapModalProps) => (
  <Modal visible={visible} transparent animationType="fade">
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

            <View style={styles.overlayFooter}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.openInMapsBtn} onPress={onOpenInMaps}>
                <FontAwesome name="map" size={18} color="white" style={{ marginRight: 8 }} />
                <Text style={styles.openInMapsText}>Open</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.dark.primary} />
            <Text style={styles.loadingText}>Locating {barName}...</Text>
          </View>
        )}
      </View>
    </View>
  </Modal>
);

export const BarHeader = ({ bar, assets, openNow }: BarHeaderProps) => (
  <View>
    <Image source={assets.cover} style={styles.coverPhoto} resizeMode="cover" />
    <View style={styles.headerRow}>
      <Image source={assets.logo} style={styles.barImage} />
      <View style={{ flex: 1 }}>
        <Text style={styles.barName}>{bar.name}</Text>
        <Text style={styles.barDescription}>{bar.description}</Text>
        <View style={[
          styles.statusPill, 
          { backgroundColor: openNow ? Theme.dark.success : Theme.container.inactiveText }
        ]}>
          <Text style={styles.statusPillText}>{openNow ? "Open" : "Closed"}</Text>
        </View>
      </View>
      <TouchableOpacity>
        <FontAwesome 
          name="star" 
          size={24} 
          color={bar.favorite ? Theme.dark.tertiary : Theme.search.inactiveInput} 
        />
      </TouchableOpacity>
    </View>
  </View>
);

export const BarStats = ({ bar }: { bar: any }) => (
  <View style={styles.statsRow}>
    <StatItem number={bar.visits ?? 0} label="Visits" />
    <StatItem number={bar.friends ?? 0} label="Friends" />
    <StatItem number={bar.favorites ?? 0} label="Favorites" />
  </View>
);

const StatItem = ({ number, label }: { number: number | string, label: string }) => (
  <View style={styles.statBox}>
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export const InfoSection = ({ title, items, emptyText }: { title: string, items: any[], emptyText: string }) => (
  <View style={styles.sectionContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {items.length ? (
      items.map((item, i) => (
        <Text key={i} style={styles.sectionItem}>• {item.name || item.title}</Text>
      ))
    ) : (
      <Text style={styles.sectionItem}>{emptyText}</Text>
    )}
  </View>
);

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