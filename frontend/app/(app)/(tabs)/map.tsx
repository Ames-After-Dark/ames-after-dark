import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';
import { useRouter } from 'expo-router';

import { useMapLocations } from '@/hooks/useMapLocations';
import { useAuth } from '@/hooks/use-auth';
import { Theme } from '@/constants/theme';
import ErrorState from '@/components/ui/error-state';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';

import { MapSkeleton } from '@/components/map/map-skeleton';
import { MapMarkers } from '@/components/map/map-markers';
import { MapBottomSheet } from '@/components/map/map-bottom-sheet';

import { useFriendsLocations } from '@/hooks/useFriendsLocations';
import { FriendMarkers } from '@/components/map/friend-markers';

const ZOOM_THRESHOLD = 0.005;

export default function MapScreen() {

    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const { userStatus } = useAuth();
    const currentUserId = userStatus?.userId ?? null;
    
    const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
    const [currentDelta, setCurrentDelta] = useState(0.1);

    const { locations, isLoading, error } = useMapLocations();
    const { friends, error: friendsError } = useFriendsLocations(currentUserId);

    useEffect(() => {
        if (friendsError) {
            console.warn('Unable to load friend locations:', friendsError.message);
        }
    }, [friendsError]);

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
                {/* The MapView stays MOUNTED. It never leaves. */}
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={{
                        latitude: 42.03,
                        longitude: -93.63,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.05,
                    }}
                    // This ensures we only update the Delta once movement STOPS
                    onRegionChangeComplete={(r) => setCurrentDelta(r.latitudeDelta)}
                    onPress={() => setSelectedLocation(null)}
                    showsPointsOfInterest={false}
                >
                    <FriendMarkers friends={friends} />
                    <MapMarkers
                        locations={locations}
                        currentDelta={currentDelta}
                        zoomThreshold={ZOOM_THRESHOLD}
                        selectedLocationId={selectedLocation?.id}
                        onSelect={setSelectedLocation}
                        mapRef={mapRef}
                    />
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
});