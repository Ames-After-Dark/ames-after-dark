
import React, { useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useMapLocations } from '@/hooks/useMapLocations';
import { type Location } from '@/services/locationService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MapScreen() {
  const { locations, isLoading, error } = useMapLocations();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const router = useRouter();

  const handleGoToBarPage = () => {
      if (!selectedLocation) return;

      // Navigate to the bar's page (e.g., /bars/1)
      router.push(`/bars/${selectedLocation.id}`);

      // Close the modal after navigating
      setSelectedLocation(null);
  };

  const renderMapContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.infoText}>Loading Locations...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      );
    }

    return (
      <MapView
        style={styles.map}
        initialRegion={{
          // Centered on Ames, IA
          latitude: 42.03,
          longitude: -93.63,
          latitudeDelta: 0.1,
          longitudeDelta: 0.05,
        }}
        showsPointsOfInterest={
            false // This is how to remove the pre-set pins on apple / google maps -- can set to true or false
        }
        onPress={() =>
            setSelectedLocation(null) // Deselect pin when the map is pressed
        }
      >
        {locations.map((location) => (
            <Marker
                key={location.id}
                coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                anchor={{ x: 0.5, y: 1 }}
            >
                <TouchableOpacity onPress={() => setSelectedLocation(location)}>
                    <View style={styles.markerContainer}>
                        <Text style={styles.markerText}>{location.name}</Text>
                        <Ionicons name="location-sharp" size={32} color="#c70000" />
                    </View>
                </TouchableOpacity>
            </Marker>
        ))}
      </MapView>
    );
  };

  return (

    <View style={styles.container}>
      <View style={styles.mapContainer}>
        {renderMapContent()}
      </View>

      <Modal
              animationType="fade"
              transparent={true}
              visible={selectedLocation !== null}
              onRequestClose={() => setSelectedLocation(null)}
            >
              {/* This Pressable is the semi-transparent backdrop */}
              <Pressable
                style={styles.modalBackdrop}
                onPress={() => setSelectedLocation(null)}
              >
                {/* This Pressable is the white popup card */}
                <Pressable style={styles.modalContainer} onPress={() => {}}>
                  <Text style={styles.modalTitle}>{selectedLocation?.name}</Text>

                  <Pressable style={styles.button} onPress={handleGoToBarPage}>
                    <Text style={styles.buttonText}>Go to Bar's Page</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.button, styles.closeButton]}
                    onPress={() => setSelectedLocation(null)}
                  >
                    <Text style={styles.buttonText}>Close</Text>
                  </Pressable>
                </Pressable>
              </Pressable>
            </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    padding: 16,
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#11181C',
  },
  infoText: {
    marginTop: 8,
    fontSize: 16,
    color: '#687076',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  markerText: {
      fontWeight: 'bold',
      color: '#ffffff',
//       backgroundColor: 'rgba(255, 255, 255, 0.7)', // put a background for the text, not sure we need this but j in case
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 5,
      marginBottom: 2,
    },
  mapContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  snackbarContainer: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 8,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10,
    },
    snackbarText: {
      color: 'white',
      fontSize: 16,
      fontWeight: 'bold',
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalContainer: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#11181C',
        marginBottom: 20,
      },
      button: {
        backgroundColor: '#153940',
        borderRadius: 8,
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
      },
      buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
      },
      closeButton: {
        backgroundColor: '#687076',
      },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
