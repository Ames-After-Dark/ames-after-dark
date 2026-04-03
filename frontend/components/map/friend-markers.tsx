import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { BarLocation, FriendLocation, GroupLocation } from '@/types/locations';
import { groupFriendsByNearbyBar } from '@/utils/nearby-friends';

import { Marker, MarkerPressEvent } from 'react-native-maps';

interface FriendMarkersProps {
    friends: FriendLocation[];
    locations: BarLocation[];
    onSelectFriend: (item: FriendLocation | GroupLocation) => void;
}

export const FriendMarkers = ({ friends, locations, onSelectFriend }: FriendMarkersProps) => {
    const barGroups = groupFriendsByNearbyBar(friends, locations);

    return (
        <>
            {barGroups.map((group) => {
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