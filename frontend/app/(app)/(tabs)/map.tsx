import React, { useState, useRef, useEffect, useMemo } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";

// Context & Services
import { useUser } from '@/context/user-context';
import { UserLocationService } from '@/services/userLocationService';

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
import { getFriendLocation } from '@/utils/nearby-friends';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';

const ZOOM_THRESHOLD = 0.005;

// TODO - 1 minute for testing, change to 1 hour for production
const GHOST_MODE_DURATION_HOURS = 0.0166667;

export default function MapScreen() {
    const insets = useSafeAreaInsets();
    const { user } = useUser();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const ghostModeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { selectedId, selectedFriendId } = useLocalSearchParams<{ selectedId?: string; selectedFriendId?: string }>();

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

            if (mapReady && !selectedId && !selectedFriendId) {
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
    }, [hasPermission, mapReady, selectedFriendId, selectedId]);

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
        const hours = nextGhostValue ? GHOST_MODE_DURATION_HOURS : 0;

        // Update button state immediately so the UI reflects the user's tap.
        setIsGhostModeEnabled(nextGhostValue);

        try {
            const result = await UserLocationService.setGhostMode(currentUserId, hours);
            const expiresAt = result?.ghost_mode_expires_at;

            if (ghostModeTimeoutRef.current) {
                clearTimeout(ghostModeTimeoutRef.current);
                ghostModeTimeoutRef.current = null;
            }

            if (expiresAt) {
                const msUntilExpiry = new Date(expiresAt).getTime() - Date.now();

                if (msUntilExpiry > 0) {
                    ghostModeTimeoutRef.current = setTimeout(() => {
                        setIsGhostModeEnabled(false);
                        ghostModeTimeoutRef.current = null;
                    }, msUntilExpiry);
                    setIsGhostModeEnabled(true);
                } else {
                    const fallbackMs = Math.max(hours * 60 * 60 * 1000, 0);
                    if (fallbackMs > 0) {
                        ghostModeTimeoutRef.current = setTimeout(() => {
                            setIsGhostModeEnabled(false);
                            ghostModeTimeoutRef.current = null;
                        }, fallbackMs);
                        setIsGhostModeEnabled(true);
                    } else {
                        setIsGhostModeEnabled(false);
                    }
                }
            } else {
                const fallbackMs = Math.max(hours * 60 * 60 * 1000, 0);
                if (fallbackMs > 0) {
                    ghostModeTimeoutRef.current = setTimeout(() => {
                        setIsGhostModeEnabled(false);
                        ghostModeTimeoutRef.current = null;
                    }, fallbackMs);
                    setIsGhostModeEnabled(true);
                } else {
                    setIsGhostModeEnabled(false);
                }
            }

            await refetchFriends();

            if (selectedLocation?.isSelf) {
                setSelectedLocation((prev: any) => prev ? { ...prev, atBarName: getUserBarName() } : prev);
            }
        } catch (err) {
            console.error('Failed to update ghost mode', err);
            setIsGhostModeEnabled(!nextGhostValue);
        } finally {
            setIsGhostModeLoading(false);
        }
    };

    useEffect(() => {
        return () => {
            if (ghostModeTimeoutRef.current) {
                clearTimeout(ghostModeTimeoutRef.current);
            }
        };
    }, []);

    const handleGoToBarPage = () => {
        if (!selectedLocation) return;
        router.push({ pathname: "/bars/[id]", params: { id: String(selectedLocation.id), backTo: "map" } });
        setSelectedLocation(null);
    };

    useEffect(() => {
        if (!mapReady || !selectedFriendId || !friends.length || !locations.length) return;

        const targetFriend = friends.find((friend) => String(friend.id) === selectedFriendId);
        if (!targetFriend) return;

        const friendLoc = getFriendLocation(targetFriend);
        const latitude = Number(friendLoc?.latitude);
        const longitude = Number(friendLoc?.longitude);

        setSelectedLocation(targetFriend);

        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
            mapRef.current?.animateCamera(
                {
                    center: {
                        latitude: latitude - 0.001,
                        longitude,
                    },
                    heading: 0,
                    altitude: 700,
                    zoom: 18,
                },
                { duration: 700 }
            );
            return;
        }

        const targetBar = targetFriend.atBarName
            ? locations.find((bar) => bar.name === targetFriend.atBarName)
            : null;

        if (targetBar) {
            mapRef.current?.animateCamera(
                {
                    center: {
                        latitude: targetBar.latitude - 0.001,
                        longitude: targetBar.longitude,
                    },
                    heading: 0,
                    altitude: 700,
                    zoom: 18,
                },
                { duration: 700 }
            );
        }
    }, [friends, locations, mapReady, selectedFriendId]);

    if (isLoading) return <MapSkeleton />;
    if (error || shouldForceErrorPage('map')) {
        return <ErrorState title="Unable to load map" subtitle={error || 'Please try again later.'} />;
    }

    return (
        <SafeAreaView style={styles.container} edges={['left', 'right']}>
            <View style={styles.container}>
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        mapPadding={{
                            top: 100 + insets.top,
                            bottom: 80 + insets.bottom,
                            left: 0,
                            right: 0
                        }}
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.dark.background,
    },
    mapContainer: {
        flex: 1,
        marginTop: 0,
        marginHorizontal: 0,
        borderRadius: 0,
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