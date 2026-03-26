import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';

// Context & Services
import { useUser } from '@/context/user-context';
import { apiFetch } from '@/services/apiClient';
import { getUserFriends } from '@/services/userService';

// Hooks
import { useFriendsLocations, useLocationTracker } from '@/hooks/useLocationTracker';
import { useMapLocations } from '@/hooks/useMapLocations';
import { useGeofence, GEOFENCE_RADIUS_METERS } from '@/hooks/useGeofence';

// UI Components & Constants
import { Theme } from '@/constants/theme';
import ErrorState from '@/components/ui/error-state';
import { MapSkeleton } from '@/components/map/map-skeleton';
import { MapMarkers } from '@/components/map/map-markers';
import { MapBottomSheet } from '@/components/map/map-bottom-sheet';
import { FriendMarkers } from '@/components/map/friend-markers';
import { calculateDistance } from '@/utils/location-utils';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';

const ZOOM_THRESHOLD = 0.005;

export default function MapScreen() {
    const { user } = useUser();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const { selectedId } = useLocalSearchParams<{ selectedId?: string }>();

    // --- State ---
    const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
    const [currentDelta, setCurrentDelta] = useState(0.1);
    const [hasPermission, setHasPermission] = useState(false);
    const [isGhostModeEnabled, setIsGhostModeEnabled] = useState(false);
    const [isGhostModeLoading, setIsGhostModeLoading] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);

    const currentUserId = user?.id;

    // --- Data Hooks ---
    const { locations, isLoading, error } = useMapLocations();
    const { friends, refetch: refetchFriends } = useFriendsLocations(currentUserId);

    // Track user location globally (updates DB)
    useLocationTracker(currentUserId, hasPermission);

    // --- Logic Hooks ---
    const activeFriends = useGeofence(friends, locations);

    // --- Effects ---

    // 1. Request Permissions
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    // 2. Initial Map Focus & User Location Sync
    useEffect(() => {
        if (!hasPermission) return;

        let subscription: Location.LocationSubscription | null = null;

        (async () => {

            // Get current pos once for initial zoom
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setUserLocation(pos.coords);

            if (mapReady && !selectedId) {
                mapRef.current?.animateToRegion({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000);
            }

            // Watch for movement
            subscription = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.Balanced, distanceInterval: 5 },
                (loc) => setUserLocation(loc.coords)
            );
        })();

        return () => subscription?.remove();
    }, [hasPermission, mapReady]);

    // --- Helpers ---

    const getUserBarName = () => {
        if (!userLocation || !locations.length) return undefined;
        const nearbyBar = locations.find((bar) => {
            const distance = calculateDistance(
                userLocation.latitude, userLocation.longitude,
                bar.latitude, bar.longitude
            );
            return distance <= GEOFENCE_RADIUS_METERS;
        });
        return nearbyBar?.name;
    };

    const handleSelectSelf = () => {
        if (!currentUserId || !userLocation) {
            return;
        }

        // 1. Update the selection state for the Bottom Sheet
        setSelectedLocation({
            id: currentUserId,
            name: user?.name || 'You',
            profile_pic_url: user?.profile_pic_url,
            isSelf: true,
            atBarName: getUserBarName(),
        });

        // 2. Animate the map to the user's current location
        mapRef.current?.animateToRegion({
            latitude: userLocation.latitude - 0.001,
            longitude: userLocation.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        }, 1000);
    };

    const handleToggleGhostMode = async () => {
        if (!currentUserId || isGhostModeLoading) return;

        setIsGhostModeLoading(true);
        const nextGhostValue = !isGhostModeEnabled;

        try {
            const allFriends = await getUserFriends(currentUserId);

            await Promise.all(
                allFriends.map((friend) =>
                    apiFetch(`/userlocations/permissions/${friend.id}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ownerId: currentUserId,
                            enabled: !nextGhostValue, // If GhostMode true, Enabled is false
                        }),
                    })
                )
            );

            // Give DB a moment to catch up
            await new Promise(resolve => setTimeout(resolve, 500));
            await refetchFriends();

            setIsGhostModeEnabled(nextGhostValue);

            if (selectedLocation?.isSelf) {
                setSelectedLocation((prev: any) => prev ? { ...prev, atBarName: getUserBarName() } : prev);
            }
        } catch (err) {
            console.error('Failed to update ghost mode', err);
        } finally {
            setIsGhostModeLoading(false);
        }
    };

    const handleGoToBarPage = () => {
        if (!selectedLocation) return;
        router.push({ pathname: "/bars/[id]", params: { id: String(selectedLocation.id), backTo: "map" } });
        setSelectedLocation(null);
    };

    if (isLoading) return <MapSkeleton />;
    if (error || shouldForceErrorPage('map')) {
        return <ErrorState title="Unable to load map" subtitle={error || 'Please try again later.'} />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    onMapReady={() => setMapReady(true)}
                    showsMyLocationButton={true}
                    showsPointsOfInterest={false}
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

                    <FriendMarkers
                        key={`friends-${activeFriends.length}`}
                        friends={activeFriends}
                        locations={locations}
                        onSelectFriend={setSelectedLocation}
                    />

                    {userLocation && (
                        <Marker
                            key="me"
                            coordinate={{
                                latitude: userLocation.latitude,
                                longitude: userLocation.longitude,
                            }}
                            zIndex={999}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleSelectSelf();
                            }}
                        >
                            <View style={styles.userMarkerContainer} pointerEvents="none">
                                <Image
                                    source={{ uri: user?.profile_pic_url || `https://ui-avatars.com/api/?name=${user?.name || 'Me'}&background=00EAFF&color=fff` }}
                                    style={styles.userAvatar}
                                />
                                <View style={styles.userMarkerPulse} />
                            </View>
                        </Marker>
                    )}
                </MapView>
            </View>

            <MapBottomSheet
                location={selectedLocation}
                onClose={() => setSelectedLocation(null)}
                onViewDetails={handleGoToBarPage}
                onSelectLocation={setSelectedLocation}
                isGhostModeEnabled={isGhostModeEnabled}
                isGhostModeLoading={isGhostModeLoading}
                onToggleGhostMode={handleToggleGhostMode}
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
    userMarkerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
        borderColor: '#00EAFF',
    },
    userAvatar: {
        width: 38,
        height: 38,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#00EAFF',
        backgroundColor: '#CCC',
    },
    userMarkerPulse: {
        position: 'absolute',
        bottom: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#00EAFF',
        opacity: 0.6,
        transform: [{ translateY: 5 }],
    },
});