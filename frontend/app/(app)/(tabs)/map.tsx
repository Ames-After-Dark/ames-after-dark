import React, { useState, useRef, useEffect } from 'react';
import MapView, { Marker, Region } from 'react-native-maps';
import { useMapLocations } from '@/hooks/useMapLocations';
import { type Location } from '@/services/locationService';
import { useRouter } from 'expo-router';

import {
    StyleSheet, View, Text, ActivityIndicator, Image, Modal,
    TouchableOpacity, Pressable, Animated, Dimensions, PanResponder
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
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                // Only allow dragging downwards (positive dy)
                if (gestureState.dy > 0) {
                    slideAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // If dragged down more than 100 pixels, close it
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

    const renderMapContent = () => {

        if (isLoading) {
            return (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" />
                    <Text style={styles.infoText}>Loading Locations!</Text>
                </View>
            );
        }

        if (error || shouldForceErrorPage('map')) {
            return (
                <ErrorState
                    title="Unable to load map locations"
                    subtitle={error || 'Please try again later.'}
                />
            );
        }

        // Locations are already validated in the service layer
        if (locations.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.infoText}>No locations available to display</Text>
                </View>
            );
        }

        const isZoomedIn = currentDelta < ZOOM_THRESHOLD;

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
                onRegionChangeComplete={handleRegionChange}
            >
                {/* {locations.map((location) => (
                <Marker
                    key={location.id}
                    coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                    anchor={{ x: 0.5, y: 1 }}
                >
                    <TouchableOpacity onPress={() => setSelectedLocation(location)}>
                        <View style={styles.markerContainer}>
                            {isZoomedIn && (
                                <Text style={styles.markerText}>{location.name}</Text>
                            )}
                            <Image
                                source={location.logo}
                                style={styles.markerLogo}
                            />
                        </View>
                    </TouchableOpacity>
                </Marker>
            ))} */}

                {locations.map((location) => {
                    // Check zoom level inside the map loop
                    const isZoomedIn = currentDelta < ZOOM_THRESHOLD;

                    return (
                        <Marker
                            key={location.id}
                            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                            // Setting this to true ensures the marker re-renders when isZoomedIn changes
                            tracksViewChanges={true}
                            onPress={() => {
                                setSelectedLocation(location);
                                mapRef.current?.animateToRegion({
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                    latitudeDelta: currentDelta,
                                    longitudeDelta: currentDelta / 2,
                                }, 300);
                            }}
                        >
                            <View style={styles.markerContainer}>
                                {isZoomedIn && (
                                    <View style={styles.nameBubble}>
                                        <Text style={styles.markerText}>{location.name}</Text>
                                    </View>
                                )}
                                <Image
                                    source={location.logo}
                                    style={styles.markerLogo}
                                />
                            </View>
                        </Marker>
                    );
                })}
            </MapView>
        );
    };

    // return (

    //     <View style={styles.container}>
    //         <View style={styles.mapContainer}>
    //             {renderMapContent()}
    //         </View>

    //         <Modal
    //             animationType="fade"
    //             transparent={true}
    //             visible={selectedLocation !== null}
    //             onRequestClose={() => setSelectedLocation(null)}
    //         >
    //             <Pressable
    //                 style={styles.modalBackdrop}
    //                 onPress={() => setSelectedLocation(null)}
    //             >
    //                 <Pressable style={styles.modalContainer} onPress={() => { }}>
    //                     <Text style={styles.modalTitle}>{selectedLocation?.name}</Text>
    //                     <Text style={styles.modalBodyText}>{selectedLocation?.hours}</Text>

    //                     <Pressable style={styles.button} onPress={handleGoToBarPage}>
    //                         <Text style={styles.buttonText}>Go to Bar's Page</Text>
    //                     </Pressable>

    //                     <Pressable
    //                         style={[styles.button, styles.closeButton]}
    //                         onPress={() => setSelectedLocation(null)}
    //                     >
    //                         <Text style={styles.buttonText}>Close</Text>
    //                     </Pressable>
    //                 </Pressable>
    //             </Pressable>
    //         </Modal>
    //     </View>
    // );

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef} // 1. CRITICAL: Ensure the ref is attached
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
                    {locations.map((location) => {
                        // 2. Calculate zoom specifically for each render pass
                        const isZoomedIn = currentDelta < ZOOM_THRESHOLD;

                        return (
                            <Marker
                                key={location.id}
                                coordinate={{
                                    latitude: location.latitude,
                                    longitude: location.longitude
                                }}
                                // 3. Force the marker to redraw its internal view
                                tracksViewChanges={true}
                                onPress={(e) => {
                                    // Stop the map from receiving this touch
                                    e.stopPropagation();
                                    setSelectedLocation(location);
                                }}
                            >
                                {/* 4. pointerEvents="none" here ensures the VIEW doesn't steal the MARKER'S click */}
                                <View style={styles.markerContainer} pointerEvents="none">
                                    {isZoomedIn && (
                                        <View style={styles.nameBubble}>
                                            <Text style={styles.markerText}>{location.name}</Text>
                                        </View>
                                    )}
                                    <Image
                                        source={location.logo}
                                        style={styles.markerLogo}
                                    />
                                </View>
                            </Marker>
                        );
                    })}
                </MapView>
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
                    {/* The Draggable Area */}
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

                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleGoToBarPage}
                    >
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
        backgroundColor: Theme.container.background,
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
    // modalBackdrop: {
    //     flex: 1,
    //     backgroundColor: 'rgba(0, 0, 0, 0.5)',
    //     justifyContent: 'center',
    //     alignItems: 'center',
    // },
    // modalContainer: {
    //     width: '80%',
    //     backgroundColor: Theme.dark.background,
    //     borderRadius: 12,
    //     padding: 20,
    //     alignItems: 'center',
    //     shadowColor: Theme.dark.black,
    //     shadowOffset: { width: 0, height: 2 },
    //     shadowOpacity: 0.25,
    //     shadowRadius: 4,
    //     elevation: 5,
    // },
    // modalTitle: {
    //     fontSize: 22,
    //     fontWeight: 'bold',
    //     color: Theme.container.titleText,
    //     marginBottom: 20,
    // },
    // modalBodyText: {
    //     fontSize: 16,
    //     color: Theme.container.inactiveText,
    //     marginBottom: 20,
    // },
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
        paddingBottom: 10, // Extra padding for bottom notches
        paddingTop: 10,
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        // Elevation for Android
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
    // Modify your modalTitle slightly for the sheet
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent black
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    dragArea: {
        width: '100%',
        height: 30, // Larger touch target
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    // dragHandle: {
    //     width: 40,
    //     height: 5,
    //     backgroundColor: Theme.search.inactiveInput,
    //     borderRadius: 3,
    // },
});
