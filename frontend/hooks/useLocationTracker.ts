import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { UserLocationService, FriendLocationService } from '@/services/user-location-service';

export function useLocationTracker(userId: number | undefined) {
    useEffect(() => {
        if (!userId) return;

        // track if the component is still alive
        let isMounted = true;
        let subscription: Location.LocationSubscription | null = null;

        const startTracking = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted' || !isMounted) return;

            try {

                const initial = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                if (isMounted) {
                    await UserLocationService.updateLocation(userId, {
                        latitude: initial.coords.latitude,
                        longitude: initial.coords.longitude,
                    });
                }

                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.Balanced,

                        // move 5 meters to trigger
                        distanceInterval: 5,
                        // update every 1 minute (60,000ms) to keep data accurate
                        timeInterval: 60000,
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
            } catch (e) {
                console.error("Location tracking setup failed", e);
            }
        };

        startTracking();

        return () => {

            // stop initial sync if unmounting
            isMounted = false;
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
        fetchFriends();

        // Polling: Update friend positions every 60 seconds (1 minute)
        const interval = setInterval(fetchFriends, 60000);
        return () => clearInterval(interval);
    }, [userId]);

    return { friends, loading, refetch: fetchFriends };
}