import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { type Location } from '@/services/locationService';
import { Theme } from '@/constants/theme';

// Define our neon colors locally or pull from your Theme
const NEON_CYAN = '#00f3ff';
const NEON_PINK = '#ff00ff';

interface Props {
    locations: Location[];
    currentDelta: number;
    zoomThreshold: number;
    selectedLocationId?: string; // We'll use this for an extra "active" glow
    onSelect: (loc: Location) => void;
    mapRef: React.RefObject<any>;
}

export const MapMarkers = ({ locations, currentDelta, zoomThreshold, selectedLocationId, onSelect, mapRef }: Props) => {
    const isZoomedIn = currentDelta < zoomThreshold;

    return useMemo(() => {
        return locations.map((location) => {
            const isSelected = selectedLocationId === location.id;

            return (
                <Marker
                    key={location.id}
                    coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                    tracksViewChanges={false}
                    zIndex={isSelected ? 10 : 1}
                    anchor={{ x: 0.5, y: 1 }}
                    onPress={(e) => {
                        e.stopPropagation();
                        onSelect(location);
                        mapRef.current?.animateCamera({
                            center: {
                                latitude: location.latitude - 0.001,
                                longitude: location.longitude,
                            },
                            altitude: 700,
                            zoom: 20,
                        }, { duration: 600 });
                    }}
                >
                    <View style={styles.markerContainer}>
                        {isZoomedIn && (
                            <View style={[styles.nameBubble, isSelected && styles.selectedBubble]}>
                                <Text style={styles.markerText}>{location.name}</Text>
                            </View>
                        )}

                        {/* The "Glow" Wrapper */}
                        <View style={[
                            styles.logoWrapper,
                            isSelected ? styles.selectedGlow : styles.standardGlow
                        ]}>
                            <Image
                                source={location.logo}
                                style={styles.markerLogo}
                                fadeDuration={0}
                            />
                        </View>

                        {/* Small neon point at the bottom of the marker */}
                        <View style={[styles.anchorPoint, { backgroundColor: isSelected ? NEON_PINK : NEON_CYAN }]} />
                    </View>
                </Marker>
            );
        });
    }, [locations, isZoomedIn, selectedLocationId]);
};

const styles = StyleSheet.create({
    markerContainer: {
        alignItems: 'center',
        paddingBottom: 5,
    },
    logoWrapper: {
        borderRadius: 16,
        borderWidth: 1,
        backgroundColor: '#000', // Dark base makes the image pop
        ...Platform.select({
            ios: {
                shadowOpacity: 1,
                shadowRadius: 2,
            },
            android: {
                elevation: 5,
            }
        })
    },
    standardGlow: {
        borderColor: NEON_CYAN,
        shadowColor: NEON_CYAN,
    },
    selectedGlow: {
        borderColor: NEON_PINK,
        shadowColor: NEON_PINK,
        transform: [{ scale: 1.1 }], // Pop out slightly when selected
    },
    markerLogo: {
        width: 36,
        height: 36,
        borderRadius: 14,
    },
    nameBubble: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: 'rgba(0, 243, 255, 0.3)', // Faint neon border
    },
    selectedBubble: {
        borderColor: NEON_PINK,
    },
    markerText: {
        fontWeight: '900',
        color: '#fff',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    anchorPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 2,
        shadowRadius: 1,
        shadowColor: '#fff',
        shadowOpacity: 0.8,
    }
});