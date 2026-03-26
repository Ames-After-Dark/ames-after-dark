import MapView from 'react-native-maps';

export function useMapCamera(mapRef: React.RefObject<MapView>, mapReady: boolean) {
    const animateToLocation = (lat: number, lng: number, delta = 0.01) => {
        if (!mapReady) return;
        mapRef.current?.animateToRegion({
            latitude: lat,
            longitude: lng,
            latitudeDelta: delta,
            longitudeDelta: delta,
        }, 1000);
    };

    return { animateToLocation };
}