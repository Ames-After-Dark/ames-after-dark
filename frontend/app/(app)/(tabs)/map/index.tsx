
import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';

// Import the map components and the custom hook
import MapView, { Marker } from 'react-native-maps';
import { useMapLocations } from '@/hooks/useMapLocations';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function MapScreen() {
  // 1. Call the hook to get location data and loading state
  const { locations, isLoading, error } = useMapLocations();

  // 2. Create a function to render the map content
  const renderMapContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText>Loading Locations...</ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
        </View>
      );
    }

    return (
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.80,
          longitude: -122.44,
          latitudeDelta: 0.1,
          longitudeDelta: 0.05,
        }}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={location.name}
          />
        ))}
      </MapView>
    );
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#153940', dark: '#153940' }}
      headerImage={<IconSymbol size={220} name="map.fill" color="#808080" />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Map</ThemedText>
      </ThemedView>

      {/* 3. Render the map inside a container with a defined height */}
      <View style={styles.mapContainer}>
        {renderMapContent()}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16, // Added padding for better spacing
  },
  // A dedicated container for the map is needed inside a ScrollView
  mapContainer: {
    height: 500, // You must give the map a specific height
    width: '100%',
    marginTop: 16,
    borderRadius: 8,
    overflow: 'hidden', // Ensures the map respects the border radius
  },
  map: {
    ...StyleSheet.absoluteFillObject, // Makes the map fill its container
  },
  centered: {
    flex: 1,
    height: 500, // Match the map container height
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  },
});