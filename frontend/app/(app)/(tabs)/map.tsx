import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import MapView from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Marker } from 'react-native-maps';

import { formatLastActive } from '@/utils/location-utils';

import { useFriendsLocations, useLocationTracker } from '@/hooks/useLocationTracker';

import { useMapLocations } from '@/hooks/useMapLocations';
import { Theme } from '@/constants/theme';
import ErrorState from '@/components/ui/error-state';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';

import { MapSkeleton } from '@/components/map/map-skeleton';
import { MapMarkers } from '@/components/map/map-markers';
import { MapBottomSheet } from '@/components/map/map-bottom-sheet';

const ZOOM_THRESHOLD = 0.005;

export default function MapScreen() {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const { locations, isLoading, error } = useMapLocations();

    const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
    const [currentDelta, setCurrentDelta] = useState(0.1);
    const [hasPermission, setHasPermission] = useState(false);

    const { selectedId } = useLocalSearchParams<{ selectedId: string }>();
    const [mapReady, setMapReady] = useState(false);

    // TODO - this is currently hardcoded for testing purposes, but should be replaced with actual user ID from auth context
    const currentUserId = 21;

    useLocationTracker(currentUserId);
    const { friends } = useFriendsLocations(currentUserId);

    // Effect 1: Just handle permissions
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    // Effect 2: Handle Camera Animation
    useEffect(() => {
        // Only fly to user if: Map is ready, we have permission, and NO bar is selected
        if (!mapReady || !hasPermission || selectedId) return;

        (async () => {
            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                mapRef.current?.animateToRegion({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            } catch (err) {
                console.error("Could not get initial location", err);
            }
        })();
    }, [mapReady, hasPermission, selectedId]); // Now this triggers correctly

    // useEffect(() => {

    //     (async () => {

    //         const { status } = await Location.requestForegroundPermissionsAsync();
    //         if (status !== 'granted') return;
    //         setHasPermission(true);

    //         const location = await Location.getCurrentPositionAsync({
    //             accuracy: Location.Accuracy.Balanced
    //         });

    //         const { latitude, longitude } = location.coords;

    //         console.log(`Initial location for ${currentUserId}: ${latitude}, ${longitude}`);
    //         console.log(`Current selected location ID is: ${selectedId}`)

    //         // animate camera
    //         if (!selectedId) {
    //             mapRef.current?.animateToRegion({
    //                 latitude,
    //                 longitude,
    //                 latitudeDelta: 0.01,
    //                 longitudeDelta: 0.01,
    //             }, 1000);
    //         }

    //     })();
    // }, [mapReady, hasPermission, selectedId]);

    // handle navigation to a specific bar from deep link/params
    useEffect(() => {
        if (!isLoading && locations.length > 0 && selectedId) {
            const target = locations.find(loc => String(loc.id) === selectedId);
            if (target) {
                setSelectedLocation(target);
                mapRef.current?.animateToRegion({
                    latitude: target.latitude - 0.001,
                    longitude: target.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }, 1000);
            }
        }
    }, [selectedId, isLoading, locations]);

    if (isLoading) return <MapSkeleton />;

    if (error || shouldForceErrorPage('map')) {
        return <ErrorState title="Unable to load map" subtitle={error || 'Try again later.'} />;
    }

    const handleGoToBarPage = () => {

        if (!selectedLocation) return;

        router.push({ pathname: "/bars/[id]", params: { id: String(selectedLocation.id), backTo: "map" } });
        setSelectedLocation(null);
    };

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    onMapReady={() => setMapReady(true)}
                    showsUserLocation={hasPermission}
                    showsMyLocationButton={true}
                    showsPointsOfInterest={false}

                    // Ames, IA
                    initialRegion={{
                        latitude: 42.03,
                        longitude: -93.63,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.05,
                    }}
                    onRegionChangeComplete={(r) => setCurrentDelta(r.latitudeDelta)}
                    onPress={() => setSelectedLocation(null)}
                >
                    <MapMarkers
                        locations={locations}
                        currentDelta={currentDelta}
                        zoomThreshold={ZOOM_THRESHOLD}
                        selectedLocationId={selectedLocation?.id}
                        onSelect={setSelectedLocation}
                        mapRef={mapRef}
                    />
                    {/* Friend Locations */}
                    {friends.map((friend) => {
                        const loc = friend.user_locations;
                        if (!loc) return null;

                        return (
                            <Marker
                                key={`friend-${friend.id}`}
                                coordinate={{
                                    latitude: loc.latitude,
                                    longitude: loc.longitude,
                                }}
                                // CRITICAL: This ensures the marker is actually tappable on Android
                                onPress={(e) => {
                                    e.stopPropagation(); // Prevents the map from also being "pressed"
                                    setSelectedLocation(friend);
                                }}
                                tappable={true}
                            >
                                {/* pointerEvents="none" makes the touch go "through" the avatar to the marker */}
                                <View style={styles.friendMarkerContainer} pointerEvents="none">
                                    <Image
                                        source={{ uri: friend.profile_pic_url || `https://ui-avatars.com/api/?name=${friend.username}&background=7b61ff&color=fff` }}
                                        style={styles.friendAvatar}
                                    />
                                    <View style={styles.friendMarkerPulse} />
                                </View>
                            </Marker>
                        );
                    })}
                </MapView>
            </View>

            <MapBottomSheet
                location={selectedLocation}
                onClose={() => setSelectedLocation(null)}
                onViewDetails={handleGoToBarPage}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.dark.background
    },
    mapContainer: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 16,
        marginHorizontal: 16
    },
    map: {
        ...StyleSheet.absoluteFillObject
    },
    friendMarkerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44, // Avatar size + border
        height: 44,
    },
    friendAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19, // Perfect circle
        borderWidth: 2,
        borderColor: Theme.dark.primary, // A color from your theme (e.g., light purple)
        backgroundColor: '#CCC', // Placeholder while loading
    },
    // Optional: a small shadow/pulse under the avatar to make it look "live"
    friendMarkerPulse: {
        position: 'absolute',
        bottom: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Theme.dark.primary,
        opacity: 0.6,
        transform: [{ translateY: 5 }], // Shift it down slightly
    },
});