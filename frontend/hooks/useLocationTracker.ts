import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { UserLocationService, FriendLocationService } from '@/services/userLocationService';
import { useAuth } from './use-auth';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLocationTracker(userId: number | undefined, hasPermission: boolean) {
    const { getAccessToken } = useAuth();

    useEffect(() => {
        if (userId === undefined || !hasPermission) return;

        const startTracking = async () => {
            try {
                const token = await getAccessToken();
                if (!token) return;

                // Sync token to SecureStore for the background task
                await SecureStore.setItemAsync('user_token', token);

                // Set an expiry time for the night (e.g., 6 hours from now)
                const sixHours = 6 * 60 * 60 * 1000;
                const expiryTime = Date.now() + sixHours;
                await AsyncStorage.setItem('trackingExpiry', expiryTime.toString());

                // Immediate foreground sync
                const initial = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });
                
                await UserLocationService.updateLocation(token, {
                    latitude: initial.coords.latitude,
                    longitude: initial.coords.longitude,
                });

                // Kick off the background task
                await Location.startLocationUpdatesAsync('NIGHT_OUT_TRACKING_TASK', {
                    accuracy: Location.Accuracy.Balanced,
                    distanceInterval: 15,
                    showsBackgroundLocationIndicator: true,
                    pausesUpdatesAutomatically: false,
                    activityType: Location.ActivityType.Fitness,
                    foregroundService: {
                        notificationTitle: "Ames After Dark",
                        notificationBody: "Keeping your location synced with friends.",
                    }
                });

                console.log("Night Out tracking active.");

            } catch (e) {
                console.error("Location tracking setup failed", e);
            }
        };

        startTracking();

        return () => {
            Location.stopLocationUpdatesAsync('NIGHT_OUT_TRACKING_TASK').catch(console.error);
            SecureStore.deleteItemAsync('user_token').catch(console.error);
            AsyncStorage.removeItem('trackingExpiry').catch(console.error);
        };
    }, [userId, hasPermission, getAccessToken]);
}

export function useFriendsLocations(userId: number | undefined) {
    const [friends, setFriends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { getAccessToken } = useAuth();

    const fetchFriends = async () => {
        if (userId === undefined) {
            setFriends([]);
            setLoading(false);
            return;
        }
        try {
            const token = await getAccessToken();
            if (!token) return;

            const data = await FriendLocationService.getFriendsLocations(token);

            // console.log("Fetched friends count:", data.length);
            // console.log("Sample friend data:", data);

            setFriends(data);
        } catch (err) {
            console.error("Error fetching friend locations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchFriends();

        // Single interval
        const interval = setInterval(fetchFriends, 15000);

        return () => clearInterval(interval);
    }, [userId]); // Only depend on userId

    return { friends, loading, refetch: fetchFriends };
}