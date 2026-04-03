import { BarLocation, FriendLocation, GroupLocation } from "@/types/locations";
import { calculateDistance } from "@/utils/location-utils";

export const FRIEND_GEOFENCE_RADIUS_METERS = 50;

const STACKED_BAR_NAMES = new Set(["sips", "paddy's irish pub"]);
const STACKED_BAR_GROUP_ID = "stacked-sips-paddys";

export function getFriendLocation(friend: FriendLocation) {
    return friend.location || friend.user_locations;
}

function getGroupMeta(bar: BarLocation) {
    const normalizedName = bar.name.trim().toLowerCase();

    if (STACKED_BAR_NAMES.has(normalizedName)) {
        return {
            groupId: STACKED_BAR_GROUP_ID,
            sourceBarId: bar.id,
            groupBar: {
                ...bar,
                id: STACKED_BAR_GROUP_ID,
                name: "Sips + Paddy's Irish Pub",
            },
        };
    }

    return {
        groupId: String(bar.id),
        sourceBarId: bar.id,
        groupBar: bar,
    };
}

export function getClosestBarForFriend(friend: FriendLocation, locations: BarLocation[]) {
    const friendLoc = getFriendLocation(friend);

    if (!friendLoc) {
        return null;
    }

    const latitude = Number(friendLoc.latitude);
    const longitude = Number(friendLoc.longitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
    }

    const closestBar = locations
        .map((bar) => ({
            ...bar,
            distance: calculateDistance(latitude, longitude, bar.latitude, bar.longitude),
        }))
        .filter((bar) => bar.distance <= FRIEND_GEOFENCE_RADIUS_METERS)
        .sort((left, right) => left.distance - right.distance)[0];

    if (!closestBar) {
        return null;
    }

    const { groupId, groupBar, sourceBarId } = getGroupMeta(closestBar);

    return {
        bar: groupBar,
        groupId,
        sourceBarId,
        distance: closestBar.distance,
    };
}

export function filterFriendsWithinRadius(friends: FriendLocation[], locations: BarLocation[]) {
    return friends.filter((friend) => getClosestBarForFriend(friend, locations));
}

export function groupFriendsByNearbyBar(friends: FriendLocation[], locations: BarLocation[]) {
    const groups = friends.reduce((acc, friend) => {
        const closestBar = getClosestBarForFriend(friend, locations);

        if (!closestBar) {
            return acc;
        }

        if (!acc[closestBar.groupId]) {
            acc[closestBar.groupId] = { bar: closestBar.bar, sourceBarId: closestBar.sourceBarId, friends: [] };
        }

        acc[closestBar.groupId].friends.push({
            ...friend,
            atBarName: closestBar.bar.name,
        });

        return acc;
    }, {} as Record<string, GroupLocation>);

    return Object.values(groups).sort((left, right) => {
        if (right.friends.length !== left.friends.length) {
            return right.friends.length - left.friends.length;
        }

        return left.bar.name.localeCompare(right.bar.name);
    });
}
