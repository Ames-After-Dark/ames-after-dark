import { useCallback, useEffect, useState } from 'react';
import { getFriendsLocations } from '@/services/userService';

const DEFAULT_POLL_MS = 30000;

export interface FriendLocation {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    lastSeen: string;
    updatedAt: string;
}

function formatLastSeen(updatedAt: string): string {
    const timestamp = new Date(updatedAt).getTime();
    if (Number.isNaN(timestamp)) {
        return 'Unknown';
    }

    const diffMs = Date.now() - timestamp;
    if (diffMs < 60_000) {
        return 'Just now';
    }

    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

function isValidCoordinate(value: number, min: number, max: number): boolean {
    return Number.isFinite(value) && value >= min && value <= max;
}

export function useFriendsLocations(userId: string | number | null, pollMs = DEFAULT_POLL_MS) {
    const [friends, setFriends] = useState<FriendLocation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(!!userId);
    const [error, setError] = useState<Error | null>(null);

    const fetchFriendsData = useCallback(async () => {
        if (!userId) {
            setFriends([]);
            setError(null);
            setIsLoading(false);
            return;
        }

        try {
            const locations = await getFriendsLocations(userId);

            const normalized: FriendLocation[] = locations
                .map((location) => {
                    const latitude = Number(location.latitude);
                    const longitude = Number(location.longitude);

                    if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) {
                        return null;
                    }

                    const updatedAt = location.updatedAt;

                    return {
                        id: String(location.id),
                        name: location.name || `User ${location.id}`,
                        latitude,
                        longitude,
                        updatedAt,
                        lastSeen: formatLastSeen(updatedAt),
                    };
                })
                .filter((location): location is FriendLocation => location !== null);

            setFriends(normalized);
            setError(null);
        } catch (err) {
            console.error('Error fetching friend locations:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch friend locations'));
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        setIsLoading(!!userId);
        fetchFriendsData();

        if (!userId) {
            return;
        }

        const interval = setInterval(fetchFriendsData, pollMs);
        return () => clearInterval(interval);
    }, [fetchFriendsData, pollMs, userId]);

    return { friends, isLoading, error, refetch: fetchFriendsData };
}