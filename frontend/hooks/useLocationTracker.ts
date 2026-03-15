import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { UserLocationService } from '@/services/user-location-service';

export function useLocationTracker(userId: number | undefined) {
    useEffect(() => {
        if (!userId) return;

        let subscription: Location.LocationSubscription | null = null;

        const startTracking = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;

            // --- CHANGE 1: DO AN INITIAL SYNC IMMEDIATELY ---
            const initial = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            await UserLocationService.updateLocation(userId, {
                latitude: initial.coords.latitude,
                longitude: initial.coords.longitude,
            }).catch(e => console.error("Initial sync failed", e));

            // --- CHANGE 2: START THE WATCHER WITH A TIME HEARTBEAT ---
            subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.Balanced,
                    distanceInterval: 15, // Update if they move 15m
                    timeInterval: 60000,  // OR update every 1 minute regardless of movement
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