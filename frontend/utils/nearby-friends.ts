import { BarLocation, FriendLocation, GroupLocation } from "@/types/locations";
import { calculateDistance } from "@/utils/location-utils";

export const FRIEND_GEOFENCE_RADIUS_METERS = 50;
const MAP_RESET_HOUR = 3;

const STACKED_BAR_NAMES = new Set(["sips", "paddy's irish pub"]);
const STACKED_BAR_GROUP_ID = "stacked-sips-paddys";

export function getFriendLocation(friend: FriendLocation) {
    return friend.location || friend.user_locations;
}

function getMapResetCutoff(now: Date) {
    const cutoff = new Date(now);
    cutoff.setHours(MAP_RESET_HOUR, 0, 0, 0);

    if (now.getHours() < MAP_RESET_HOUR) {
        cutoff.setDate(cutoff.getDate() - 1);
    }

    return cutoff;
}

function isFriendFreshEnough(friend: FriendLocation, now: Date) {
    const friendLoc = getFriendLocation(friend);
    const updatedAt = friendLoc?.updated_at ? new Date(friendLoc.updated_at).getTime() : 0;

    return updatedAt >= getMapResetCutoff(now).getTime();
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

    const nearbyBars = locations
        .map((bar) => ({
            ...bar,
            distance: calculateDistance(latitude, longitude, bar.latitude, bar.longitude),
        }))
        .filter((bar) => bar.distance <= FRIEND_GEOFENCE_RADIUS_METERS)
        .sort((left, right) => left.distance - right.distance);

    if (!nearbyBars.length) {
        return null;
    }

    const closestBar = nearbyBars.find((bar) => bar.open === true);

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
    const now = new Date();

    return friends.filter((friend) => {
        if (!isFriendFreshEnough(friend, now)) {
            return false;
        }

        return Boolean(getClosestBarForFriend(friend, locations));
    });
}

export function groupFriendsByNearbyBar(friends: FriendLocation[], locations: BarLocation[]) {
    const now = new Date();
    const friendsWithBars = friends
        .filter((friend) => isFriendFreshEnough(friend, now))
        .map((friend) => ({
            friend,
            closestBar: getClosestBarForFriend(friend, locations),
        }))
        .filter((entry): entry is { friend: FriendLocation; closestBar: NonNullable<ReturnType<typeof getClosestBarForFriend>> } => Boolean(entry.closestBar));

    const groups = friendsWithBars.reduce((acc, { friend, closestBar }) => {
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
