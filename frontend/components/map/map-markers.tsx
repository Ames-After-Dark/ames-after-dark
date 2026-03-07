import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { type Location } from '@/services/locationService';
import { Theme } from '@/constants/theme';

interface Props {
    locations: Location[];
    currentDelta: number;
    zoomThreshold: number;
    selectedLocationId?: string;
    onSelect: (loc: Location) => void;
    mapRef: React.RefObject<any>;
}

export const MapMarkers = ({ locations, currentDelta, zoomThreshold, selectedLocationId, onSelect, mapRef }: Props) => {

    const isZoomedIn = currentDelta < zoomThreshold;

    return useMemo(() => {
        return locations.map((location) => (
            <Marker

                key={location.id}
                coordinate={{ latitude: location.latitude, longitude: location.longitude }}

                tracksViewChanges={false}

                zIndex={1}

                anchor={{ x: 0.5, y: 1 }}

                onPress={(e) => {
                    e.stopPropagation();
                    onSelect(location);

                    mapRef.current?.animateCamera({
                        center: {
                            latitude: location.latitude - 0.001, // Minor offset for the sheet
                            longitude: location.longitude,
                        },
                        // pitch: 45,       
                        heading: 0,      
                        altitude: 700,   // "Altitude" in meters (Lower --> Zoomed In)
                        zoom: 20,        // standard zoom level (0-20)
                    }, { duration: 600 });
                }}
            >
                <View style={styles.markerContainer} pointerEvents="none">
                    {isZoomedIn && (
                        <View style={styles.nameBubble}>
                            <Text style={styles.markerText}>{location.name}</Text>
                        </View>
                    )}
                    <Image
                        source={location.logo}
                        style={styles.markerLogo}
                        fadeDuration={0}
                    />
                </View>
            </Marker>
        ));
    }, [locations, isZoomedIn]);
};

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: 'center'
    },
    markerLogo: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.dark.white
    },
    markerText: {
        fontWeight: 'bold',
        color: Theme.container.titleText,
        fontSize: 12
    },
    nameBubble: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)'
    },
});