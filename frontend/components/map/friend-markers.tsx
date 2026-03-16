import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Theme } from '@/constants/theme';

interface FriendMarkersProps {
    friends: any[];
    onSelectFriend: (friend: any) => void;
}

export const FriendMarkers = ({ friends, onSelectFriend }: FriendMarkersProps) => {
    return (
        <>
            {friends.map((friend) => {
                const loc = friend.user_locations;
                if (!loc) return null;

                const fallbackAvatar = `https://ui-avatars.com/api/?name=${friend.username}&background=7b61ff&color=fff`;

                return (
                    <Marker
                        key={`friend-${friend.id}`}
                        coordinate={{
                            latitude: loc.latitude,
                            longitude: loc.longitude,
                        }}
                        onPress={(e) => {
                            e.stopPropagation();
                            onSelectFriend(friend);
                        }}
                        tappable={true}
                    >
                        <View style={styles.friendMarkerContainer} pointerEvents="none">
                            <Image
                                source={{ uri: friend.profile_pic_url || fallbackAvatar }}
                                style={styles.friendAvatar}
                            />
                            <View style={styles.friendMarkerPulse} />
                        </View>
                    </Marker>
                );
            })}
        </>
    );
};

const styles = StyleSheet.create({
    friendMarkerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 44,
        height: 44,
    },
    friendAvatar: {
        width: 38,
        height: 38,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: Theme.dark.primary,
        backgroundColor: '#CCC',
    },
    friendMarkerPulse: {
        position: 'absolute',
        bottom: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Theme.dark.primary,
        opacity: 0.6,
        transform: [{ translateY: 5 }],
    },
});