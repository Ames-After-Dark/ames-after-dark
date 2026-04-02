import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { calculateDistance } from '@/utils/location-utils';
import { Theme } from '@/constants/theme';
import { BarLocation, FriendLocation, GroupLocation } from '@/types/locations';

import { Marker, MarkerPressEvent } from 'react-native-maps';

interface FriendMarkersProps {
    friends: FriendLocation[];
    locations: BarLocation[];
    onSelectFriend: (item: FriendLocation | GroupLocation) => void;
}

// TODO - define the radius for geofencing; no clue what it should be
export const GEOFENCE_RADIUS_METERS = 50;

const STACKED_BAR_NAMES = new Set(['sips', "paddy's irish pub"]);
const STACKED_BAR_GROUP_ID = 'stacked-sips-paddys';

const getGroupMeta = (bar: BarLocation) => {
    const normalizedName = bar.name.trim().toLowerCase();

    if (STACKED_BAR_NAMES.has(normalizedName)) {
        return {
            groupId: STACKED_BAR_GROUP_ID,
            groupBar: {
                ...bar,
                id: STACKED_BAR_GROUP_ID,
                name: "Sips + Paddy's Irish Pub",
            },
        };
    }

    return {
        groupId: String(bar.id),
        groupBar: bar,
    };
};

export const FriendMarkers = ({ friends, locations, onSelectFriend }: FriendMarkersProps) => {
    const barGroups = friends.reduce((acc, friend) => {

        if (!friend.user_locations) return acc;

        const { latitude, longitude } = friend.user_locations;
        const lat = Number(latitude);
        const lon = Number(longitude);

        if (Number.isNaN(lat) || Number.isNaN(lon)) {
            return acc;
        }

        // const atBar = locations.find(bar =>
        //     calculateDistance(
        //         lat,
        //         lon,
        //         bar.latitude,
        //         bar.longitude
        //     ) <= GEOFENCE_RADIUS_METERS
        // );

        const atBar = locations
            .map(bar => ({
                ...bar,
                distance: calculateDistance(lat, lon, bar.latitude, bar.longitude)
            }))
            // Filter by radius first
            .filter(bar => bar.distance <= GEOFENCE_RADIUS_METERS)
            // Sort by distance (ascending)
            .sort((a, b) => a.distance - b.distance)[0]; // Grab the absolute closest

        console.log(`Friend ${friend.name} is ${atBar ? `at ${atBar.name} (${atBar.distance.toFixed(1)}m away)` : 'not at any bar'}`);

        if (atBar) {
            const { groupId, groupBar } = getGroupMeta(atBar);

            if (!acc[groupId]) {
                acc[groupId] = { bar: groupBar, friends: [] };
            }

            acc[groupId].friends.push(friend);
        }
        return acc;
    }, {} as Record<string, GroupLocation>);

    return (
        <>
            {Object.values(barGroups).map((group) => {
                const barId = String(group.bar.id);

                return (
                    <Marker
                        key={`group-${barId}`}
                        coordinate={{
                            latitude: group.bar.latitude,
                            longitude: group.bar.longitude
                        }}
                        onPress={(e: MarkerPressEvent) => {
                            e.stopPropagation();
                            onSelectFriend(
                                group.friends.length === 1
                                    ? { ...group.friends[0], atBarName: group.bar.name }
                                    : group
                            );
                        }}
                        zIndex={100}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <View style={styles.groupMarkerContainer}>
                            <Image
                                source={{
                                    uri: group.friends[0].profile_pic_url ||
                                        `https://ui-avatars.com/api/?name=${encodeURIComponent(group.friends[0].name)}&background=7b61ff&color=fff`
                                }}
                                style={styles.friendAvatar}
                            />

                            {group.friends.length > 1 && (
                                <View style={styles.badgeContainer}>
                                    <Text style={styles.badgeText}>+{group.friends.length - 1}</Text>
                                </View>
                            )}
                        </View>
                    </Marker>
                );
            })}
        </>
    );
};

const styles = StyleSheet.create({
    groupMarkerContainer: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    friendAvatar: {
        width: 38,
        height: 38,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: Theme.dark.accent,
        backgroundColor: '#CCC',
    },
    badgeContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: Theme.dark.accent,
        borderRadius: 10,
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
});