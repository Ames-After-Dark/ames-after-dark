import React from 'react';
import { Marker, Callout } from 'react-native-maps';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { FriendLocation } from '@/hooks/useFriendsLocations';

interface Props {
    friends: FriendLocation[];
}

export function FriendMarkers({ friends }: Props) {
    return (
        <>
            {friends.map((friend) => (
                <Marker
                    key={friend.id}
                    coordinate={{ latitude: friend.latitude, longitude: friend.longitude }}
                    // Light Purple/Blue accent for friends
                    pinColor={Theme.dark.primary || '#BB86FC'} 
                >
                    <Callout>
                        <View style={styles.callout}>
                            <Text style={styles.name}>{friend.name}</Text>
                            <Text style={styles.time}>{friend.lastSeen}</Text>
                        </View>
                    </Callout>
                </Marker>
            ))}
        </>
    );
}

const styles = StyleSheet.create({
    callout: { 
        padding: 8, 
        minWidth: 100 
    },
    name: { 
        fontWeight: 'bold', 
        fontSize: 14 
    },
    time: { 
        fontSize: 12, 
        color: '#666' 
    }
});