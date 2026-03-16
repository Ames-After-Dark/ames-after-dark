import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { calculateDistance } from '@/utils/location-utils';
import { Theme } from '@/constants/theme';
import { BarLocation, FriendLocation, GroupLocation } from '@/types/locations';

import { MarkerAnimated, AnimatedRegion, MapPressEvent } from 'react-native-maps';

// Define the Props for this component
interface FriendMarkersProps {
    friends: FriendLocation[];
    locations: BarLocation[];
    onSelectFriend: (item: FriendLocation | { bar: BarLocation, friends: FriendLocation[] }) => void;
}

const GEOFENCE_RADIUS_METERS = 50; // TODO - define the radius for geofencing; no clue what it should be

export const FriendMarkers = ({ friends, locations, onSelectFriend }: FriendMarkersProps) => {

    // const [coordsMap] = useState(new Map());
    const [animatedRegions] = useState(new Map<string, AnimatedRegion>());

    const barGroups = friends.reduce((acc, friend) => {
        const atBar = locations.find(bar =>
            calculateDistance(
                friend.user_locations.latitude,
                friend.user_locations.longitude,
                bar.latitude,
                bar.longitude
            ) <= GEOFENCE_RADIUS_METERS
        );

        if (atBar) {
            // Use the bar's ID as the key for the group
            const barId = String(atBar.id);

            if (!acc[barId]) {
                acc[barId] = { bar: atBar, friends: [] };
            }
            acc[barId].friends.push(friend);
        }
        return acc;
    }, {} as Record<string, { bar: BarLocation; friends: FriendLocation[] }>);

    const getAnimatedRegion = (barId: string, lat: number, lng: number) => {
        if (!animatedRegions.has(barId)) {
            animatedRegions.set(barId, new AnimatedRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002,
            }));
        }

        const region = animatedRegions.get(barId)!;

        // Use 'as any' on the config object to bypass the X/Y coordinate error
        region.timing({
            toValue: {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002,
            },
            duration: 1000,
            useNativeDriver: false,
        } as any).start();

        return region;
    };

    // return (
    //     <>
    //         {Object.values(barGroups).map((group: any) => (
    //             <Marker
    //                 key={`group-${group.bar.id}`}
    //                 coordinate={{
    //                     latitude: group.bar.latitude,
    //                     longitude: group.bar.longitude
    //                 }}

    //                 // If 1 person, selecting shows the Friend. If >1, it shows the Group object.
    //                 onPress={(e) => {
    //                     e.stopPropagation();
    //                     onSelectFriend(group.friends.length === 1 ? group.friends[0] : group);
    //                     console.log(group.friends[0].name)
    //                 }}
    //                 zIndex={100}
    //                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    //             >
    //                 <View style={styles.groupMarkerContainer}>
    //                     <Image
    //                         source={{ uri: group.friends[0].profile_pic_url || `https://ui-avatars.com/api/?name=${group.friends[0].name}&background=7b61ff&color=fff` }}
    //                         style={styles.friendAvatar}
    //                     />

    //                     {/* only shows if more than 1 person is there */}
    //                     {group.friends.length > 1 && (
    //                         <View style={styles.badgeContainer}>
    //                             <Text style={styles.badgeText}>+{group.friends.length - 1}</Text>
    //                         </View>
    //                     )}
    //                 </View>
    //             </Marker>
    //         ))}
    //     </>
    // );

    return (
        <>
            {Object.values(barGroups).map((group) => {
                const barId = String(group.bar.id);
                const animatedCoordinate = getAnimatedRegion(
                    barId,
                    group.bar.latitude,
                    group.bar.longitude
                );

                return (
                    <MarkerAnimated
                        key={`group-${barId}`}
                        // Use the animated coordinate instead of a fixed object
                        coordinate={animatedCoordinate as any}
                        onPress={(e: MapPressEvent) => {
                            e.stopPropagation();
                            onSelectFriend(group.friends.length === 1 ? group.friends[0] : group);
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
                    </MarkerAnimated>
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