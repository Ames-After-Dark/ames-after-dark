import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { UserLocationService, FriendLocationService } from '@/services/userLocationService';
import { useAuth } from './use-auth';

export function useLocationTracker(hasPermission: boolean) {
    const { getAccessToken } = useAuth();

    useEffect(() => {
        if (!hasPermission) return;

        // track if the component is still alive
        let isMounted = true;
        let subscription: Location.LocationSubscription | null = null;

        const startTracking = async () => {

            if (!isMounted) return;

            try {
                const initial = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });
                if (!isMounted) {
                    return;
                }

                const token = await getAccessToken();
                if (!token) return;

                await UserLocationService.updateLocation({
                    latitude: initial.coords.latitude,
                    longitude: initial.coords.longitude,
                }, token);

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
                            const ongoingToken = await getAccessToken();
                            if (!ongoingToken) return;

                            await UserLocationService.updateLocation({
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                            }, ongoingToken);
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
    }, [hasPermission, getAccessToken]);
}

export function useFriendsLocations() {
    const { getAccessToken } = useAuth();
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFriends = async () => {
        try {
            const token = await getAccessToken();
            if (!token) {
                setFriends([]);
                setLoading(false);
                return;
            }

            const data = await FriendLocationService.getFriendsLocations(token);

            console.log("Fetched friends count:", data.length);
            console.log("Sample friend data:", data);

            setFriends(data);
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
        // Optional: refresh periodically (e.g. every minute)
        const intervalId = setInterval(fetchFriends, 60000);
        return () => clearInterval(intervalId);
    }, [getAccessToken]);

    return { friends, loading, refetch: fetchFriends };
}