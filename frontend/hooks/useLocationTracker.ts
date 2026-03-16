import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { UserLocationService, FriendLocationService } from '@/services/user-location-service';

export function useLocationTracker(userId: number | undefined) {
    useEffect(() => {
        if (!userId) return;

        let subscription: Location.LocationSubscription | null = null;

        const startTracking = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            const initial = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            await UserLocationService.updateLocation(userId, {
                latitude: initial.coords.latitude,
                longitude: initial.coords.longitude,
            }).catch(e => console.error("Initial sync failed", e));

            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    distanceInterval: 10, // update if they move 10 m
                    timeInterval: 6000,   // or update every 1 minute regardless of movement
                },
                async (location) => {
                    try {
                        await UserLocationService.updateLocation(userId, {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude,
                        });
                    } catch (err) {
                        console.error("Failed to sync location with server", err);
                    }
                }
            );
        };

        startTracking();

        return () => {
            subscription?.remove();
        };
    }, [userId]);
}

export function useFriendsLocations(userId: number) {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFriends = async () => {
        try {
            const data = await FriendLocationService.getFriendsLocations(userId);
            setFriends(data);
        } catch (err) {
            console.error("Error fetching friend locations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends(); // Initial fetch

        // Polling: Update friend positions every 60 seconds (1 minutes)
        const interval = setInterval(fetchFriends, 60000);
        return () => clearInterval(interval);
    }, [userId]);

    return { friends, loading, refetch: fetchFriends };
}