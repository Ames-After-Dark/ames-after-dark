import React, { useState, useRef, useEffect, useMemo } from 'react';
import MapView, { Marker, Region } from 'react-native-maps';
import { useMapLocations } from '@/hooks/useMapLocations';
import { type Location } from '@/services/locationService';
import { useRouter } from 'expo-router';

import {
    StyleSheet, View, Text, ActivityIndicator, Image,
    TouchableOpacity, Animated, Dimensions, PanResponder
} from 'react-native';

import { Theme } from '@/constants/theme';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';
import ErrorState from '@/components/ui/error-state';

const ZOOM_THRESHOLD = 0.005;

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function MapScreen() {

    const { locations, isLoading, error } = useMapLocations();
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

    const [currentDelta, setCurrentDelta] = useState(0.1);

    const mapRef = React.useRef<MapView>(null);

    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;


    const router = useRouter();

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,

            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 10;
            },

            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    slideAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {

                if (gestureState.dy > 100 || gestureState.vy > 0.5) {
                    setSelectedLocation(null);
                } else {

                    // Otherwise, snap back to open position
                    Animated.spring(slideAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 50,
                        friction: 8,
                    }).start();
                }
            },
        })
    ).current;

    useEffect(() => {
        if (selectedLocation) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: SCREEN_HEIGHT,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [selectedLocation]);

    const handleGoToBarPage = () => {
        if (!selectedLocation) return;

        // Navigate to the bar's page
        router.push({
            pathname: "/bars/[id]",
            params: { id: String(selectedLocation.id), backTo: "map" },
        });

        // Close the modal after leaving the maps page
        setSelectedLocation(null);
    };

    // Handle the user zooming in / out on the map changing the delta
    const handleRegionChange = (region: Region) => {
        setCurrentDelta(region.latitudeDelta);
    };

    const SkeletonPlaceholder = () => {
        const opacity = useRef(new Animated.Value(0.3)).current;

        useEffect(() => {
            // Create a shimmering loop
            Animated.loop(
                Animated.sequence([
                    Animated.timing(opacity, {
                        toValue: 0.7,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0.3,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, []);

        return (
            <View style={styles.container}>
                {/* Map Placeholder */}
                <View style={styles.mapContainer}>
                    <Animated.View style={[styles.skeletonMap, { opacity }]} />
                </View>

                {/* Bottom Sheet Placeholder (Simulating the peek) */}
                <View style={styles.skeletonSheet}>
                    <View style={styles.dragHandle} />
                    <View style={styles.sheetHeader}>
                        <Animated.View style={[styles.skeletonCircle, { opacity }]} />
                        <View style={{ gap: 8 }}>
                            <Animated.View style={[styles.skeletonLine, { width: 150, opacity }]} />
                            <Animated.View style={[styles.skeletonLine, { width: 100, opacity }]} />
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const memoizedMarkers = useMemo(() => {
        const isZoomedIn = currentDelta < ZOOM_THRESHOLD;

        return locations.map((location) => (
            <Marker
                key={location.id}
                coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                tracksViewChanges={false}
                zIndex={selectedLocation?.id === location.id ? 99 : 1}
                onPress={(e) => {
                    e.stopPropagation();
                    setSelectedLocation(location);

                    // Add this so the map centers on the bar when tapped
                    mapRef.current?.animateToRegion({
                        latitude: location.latitude - (currentDelta * 0.1), // Offset so it's not hidden by sheet
                        longitude: location.longitude,
                        latitudeDelta: currentDelta,
                        longitudeDelta: currentDelta,
                    }, 400);
                }}
            >
                <View style={styles.markerContainer} pointerEvents="none">
                    {isZoomedIn && (
                        <View style={styles.nameBubble}>
                            <Text style={styles.markerText}>{location.name}</Text>
                        </View>
                    )}
                    <Image source={location.logo} style={styles.markerLogo} />
                </View>
            </Marker>
        ));
    }, [locations, currentDelta < ZOOM_THRESHOLD, selectedLocation?.id, currentDelta]);

    const renderMapContent = () => {

        if (isLoading) {
            return <SkeletonPlaceholder />;
        }

        if (error || shouldForceErrorPage('map')) {
            return (
                <ErrorState
                    title="Unable to load map locations"
                    subtitle={error || 'Please try again later.'}
                />
            );
        }

        if (locations.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.infoText}>No locations available</Text>
                </View>
            );
        }

        return (
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={{
                    latitude: 42.03,
                    longitude: -93.63,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.05,
                }}
                showsPointsOfInterest={false}
                onPress={() => setSelectedLocation(null)}
                onRegionChangeComplete={handleRegionChange}
            >
                {memoizedMarkers}
            </MapView>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                {renderMapContent()}
            </View>

            <Animated.View
                pointerEvents={selectedLocation ? 'auto' : 'none'}
                style={[
                    styles.bottomSheet,
                    {
                        transform: [{
                            translateY: slideAnim.interpolate({
                                inputRange: [-100, 0, SCREEN_HEIGHT],
                                outputRange: [0, 0, SCREEN_HEIGHT],
                            })
                        }]
                    }
                ]}
            >
                <View style={styles.sheetContent}>
                    <View {...panResponder.panHandlers} style={styles.dragArea}>
                        <View style={styles.dragHandle} />
                    </View>

                    <View style={styles.sheetHeader}>
                        <Image source={selectedLocation?.logo} style={styles.sheetLogo} />
                        <View>
                            <Text style={styles.modalTitle}>{selectedLocation?.name}</Text>
                            <Text style={styles.modalBodyText}>{selectedLocation?.hours}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={handleGoToBarPage}>
                        <Text style={styles.buttonText}>View Full Details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.closeButton]}
                        onPress={() => setSelectedLocation(null)}
                    >
                        <Text style={styles.buttonText}>Dismiss</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.dark.background,
    },
    infoText: {
        marginTop: 8,
        fontSize: 16,
        color: Theme.search.inactiveInput,
    },
    markerText: {
        fontWeight: 'bold',
        color: Theme.container.titleText,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 5,
        marginBottom: 2,
        textAlign: 'center',
    },
    markerContainer: {
        alignItems: 'center',
    },
    mapContainer: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 16,
        marginHorizontal: 16,
    },
    button: {
        backgroundColor: Theme.dark.primary,
        borderRadius: 8,
        paddingVertical: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: Theme.container.titleText,
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        backgroundColor: Theme.dark.error,
    },
    markerLogo: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Theme.dark.white,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        // backgroundColor: Theme.container.background,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        // paddingBottom: 10,
        paddingTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 20,
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: Theme.search.inactiveInput,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15,
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 15,
    },
    sheetLogo: {
        width: 60,
        height: 60,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: Theme.dark.primary,
    },
    sheetContent: {
        width: '100%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Theme.container.titleText,
    },
    modalBodyText: {
        fontSize: 14,
        color: Theme.container.inactiveText,
    },
    nameBubble: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    dragArea: {
        width: '100%',
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    skeletonMap: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#2C2C2C',
    },
    skeletonSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    skeletonCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#333',
    },
    skeletonLine: {
        height: 15,
        borderRadius: 4,
        backgroundColor: '#333',
    },
});
