import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import MapView from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Marker } from 'react-native-maps';

import { useUser } from '@/context/user-context';

import { useFriendsLocations, useLocationTracker } from '@/hooks/useLocationTracker';

import { useMapLocations } from '@/hooks/useMapLocations';
import { Theme } from '@/constants/theme';
import ErrorState from '@/components/ui/error-state';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';
import { calculateDistance } from '@/utils/location-utils';

import { MapSkeleton } from '@/components/map/map-skeleton';
import { MapMarkers } from '@/components/map/map-markers';
import { MapBottomSheet } from '@/components/map/map-bottom-sheet';
import { FriendMarkers } from '@/components/map/friend-markers';

const ZOOM_THRESHOLD = 0.005;

// TODO - adjust based on Ames bar sizes; no clue what this should really be
const GEOFENCE_RADIUS_METERS = 50;

export default function MapScreen() {

    // get global user data from context (for user ID and auth token)
    const { user, isLoading: isUserLoading } = useUser();

    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const { locations, isLoading, error } = useMapLocations();

    const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
    const [currentDelta, setCurrentDelta] = useState(0.1);
    const [hasPermission, setHasPermission] = useState(false);

    const { selectedId } = useLocalSearchParams<{ selectedId: string }>();
    const [mapReady, setMapReady] = useState(false);
    const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);

    const currentUserId = user?.id;

    useLocationTracker(currentUserId);
    const { friends } = useFriendsLocations(currentUserId);

    // handle permissions
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    // handle camera animation
    useEffect(() => {

        // only fly to user if: map is ready, we have permission, no bar is selected
        if (!mapReady || !hasPermission || selectedId) return;

        (async () => {
            try {
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                setUserLocation(location.coords);

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
    }, [mapReady, hasPermission, selectedId]);

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

    const activeFriends = friends.filter(friend => {
        const friendLoc = friend.user_locations;
        if (!friendLoc) return false;

        // check if the friend is within the radius of any bar
        return locations.some(bar => {
            const distance = calculateDistance(
                friendLoc.latitude,
                friendLoc.longitude,
                bar.latitude,
                bar.longitude
            );
            return distance <= GEOFENCE_RADIUS_METERS;
        });
    });

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

                    <FriendMarkers
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
                        >
                            <View style={[styles.friendMarkerContainer, { borderColor: '#00EAFF' }]}>
                                <Image
                                    source={{ uri: user?.profile_pic_url || `https://ui-avatars.com/api/?name=${user?.name || 'Me'}&background=00EAFF&color=fff` }}
                                    style={styles.friendAvatar}
                                />
                                <View style={[styles.friendMarkerPulse, { backgroundColor: '#00EAFF' }]} />
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
        width: 44,
        height: 44,
    },
    friendAvatar: {
        width: 38,
        height: 38,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#7b61ff',
        backgroundColor: '#CCC',
    },
    friendMarkerPulse: {
        position: 'absolute',
        bottom: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#7b61ff',
        opacity: 0.6,
        transform: [{ translateY: 5 }],
    },
});