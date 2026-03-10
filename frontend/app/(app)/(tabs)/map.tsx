import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';

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

    const { selectedId } = useLocalSearchParams<{ selectedId: string }>();

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
                    initialRegion={{
                        latitude: 42.03,
                        longitude: -93.63,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.05,
                    }}
                    onRegionChangeComplete={(r) => setCurrentDelta(r.latitudeDelta)}
                    onPress={() => setSelectedLocation(null)}
                    showsPointsOfInterest={false}
                >
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