import { useMemo } from 'react';
import { BarLocation, FriendLocation } from '@/types/locations';
import { FRIEND_GEOFENCE_RADIUS_METERS, filterFriendsWithinRadius } from '@/utils/nearby-friends';

export const GEOFENCE_RADIUS_METERS = FRIEND_GEOFENCE_RADIUS_METERS;

export function useGeofence(friends: FriendLocation[], locations: BarLocation[]) {
    const activeFriends = useMemo(() => {
        if (!friends.length || !locations.length) return [];

        return filterFriendsWithinRadius(friends, locations);
    }, [friends, locations]);

    return activeFriends;
}

