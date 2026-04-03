import { useMemo } from 'react';
import { calculateDistance } from '@/utils/location-utils';

export const GEOFENCE_RADIUS_METERS = 50;

export function useGeofence(friends: any[], locations: any[]) {
    const activeFriends = useMemo(() => {
        if (!friends.length || !locations.length) return [];

        return friends.filter(friend => {
            // Check for the new 'location' key, but fallback to 'user_locations'
            const friendLoc = friend.location || friend.user_locations;

            if (!friendLoc) {
                console.log(`Skipping ${friend.name}: No location data found.`);
                return false;
            }

            const friendLat = Number(friendLoc.latitude);
            const friendLng = Number(friendLoc.longitude);

            if (isNaN(friendLat) || isNaN(friendLng)) return false;

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

    console.log(`printing active friends within geofence: ${activeFriends.length}`);

    for (const friend of activeFriends) {
        console.log(`Friend ${friend.name} is within geofence of a bar!`);
    }

    return activeFriends;
}

