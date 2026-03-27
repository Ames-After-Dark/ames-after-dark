import { useMemo } from 'react';
import { calculateDistance } from '@/utils/location-utils';

export const GEOFENCE_RADIUS_METERS = 50;

export function useGeofence(friends: any[], locations: any[]) {
    const activeFriends = useMemo(() => {

        // If we don't have bars or friends yet, return empty
        if (!friends.length || !locations.length) return [];

        return friends.filter(friend => {
            const friendLoc = friend.user_locations;
            if (!friendLoc) return false;

            const friendLat = Number(friendLoc.latitude);
            const friendLng = Number(friendLoc.longitude);

            // Safety check for valid coordinates
            if (isNaN(friendLat) || isNaN(friendLng)) return false;

            // Check if the friend is within the radius of ANY bar
            return locations.some(bar => {
                const distance = calculateDistance(
                    friendLat,
                    friendLng,
                    bar.latitude,
                    bar.longitude
                );
                return distance <= GEOFENCE_RADIUS_METERS;
            });
        });
    }, [friends, locations]);

    return activeFriends;
}