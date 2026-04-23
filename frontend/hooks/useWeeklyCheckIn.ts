import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BarLocation } from '@/types/locations';
import { calculateDistance } from '@/utils/location-utils';
import { GEOFENCE_RADIUS_METERS } from '@/hooks/useGeofence';
import { UserLocationService } from '@/services/userLocationService';
import { useAuth } from './use-auth';

type UseWeeklyCheckInArgs = {
    userId?: number;
    userLocation: { latitude: number; longitude: number } | null;
    locations: BarLocation[];
    enabled?: boolean;
    onStreakUpdate?: (streak: number) => void | Promise<void>;
};

const STORAGE_PREFIX = 'weekly-streak-checkin';

function getWeeklyBucket(now = new Date()) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = date.getDay() || 7;
    date.setDate(date.getDate() + 4 - day);

    const yearStart = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

    return `${date.getFullYear()}-${String(weekNumber).padStart(2, '0')}`;
}

function getClosestOpenBar(userLocation: { latitude: number; longitude: number }, locations: BarLocation[]) {
    const nearbyBars = locations
        .filter((location) => location.open)
        .map((location) => ({
            location,
            distance: calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                location.latitude,
                location.longitude
            ),
        }))
        .filter(({ distance }) => distance <= GEOFENCE_RADIUS_METERS)
        .sort((left, right) => left.distance - right.distance);

    return nearbyBars[0]?.location ?? null;
}

export function useWeeklyCheckIn({
    userId,
    userLocation,
    locations,
    enabled = true,
    onStreakUpdate,
}: UseWeeklyCheckInArgs) {
    const { getAccessToken } = useAuth();
    const checkingRef = useRef(false);
    const onStreakUpdateRef = useRef(onStreakUpdate);

    useEffect(() => {
        onStreakUpdateRef.current = onStreakUpdate;
    }, [onStreakUpdate]);

    useEffect(() => {
        let cancelled = false;

        const runCheckIn = async () => {
            if (!enabled || !userId || !userLocation || !locations.length || checkingRef.current) {
                return;
            }

            const nearestBar = getClosestOpenBar(userLocation, locations);
            if (!nearestBar) {
                return;
            }

            const bucket = getWeeklyBucket();
            const storageKey = `${STORAGE_PREFIX}:${userId}:${bucket}`;
            const cachedResult = await AsyncStorage.getItem(storageKey);
            if (cachedResult) {
                return;
            }

            checkingRef.current = true;

            try {
                const token = await getAccessToken();
                if (!token) {
                    return;
                }

                const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Chicago';
                const result = await UserLocationService.checkWeeklyStreak(token, Number(nearestBar.id), timezone);

                await AsyncStorage.setItem(storageKey, JSON.stringify({
                    streak: result?.streak ?? null,
                    locationId: nearestBar.id,
                    updatedAt: new Date().toISOString(),
                }));

                if (!cancelled && typeof result?.streak === 'number') {
                    await onStreakUpdateRef.current?.(result.streak);
                }
            } catch (error) {
                console.error('Failed to update weekly streak:', error);
            } finally {
                checkingRef.current = false;
            }
        };

        void runCheckIn();

        return () => {
            cancelled = true;
        };
    }, [enabled, getAccessToken, locations, userId, userLocation?.latitude, userLocation?.longitude]);
}