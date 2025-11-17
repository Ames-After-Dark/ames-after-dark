import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ImageSourcePropType,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';

import { UserProfile, UserDatabase } from '@types/types.ts';

export default function AccountScreen() {

    const [searchQuery, setSearchQuery] = useState<string>('');

    // Mock data for the user's friends
    const friends: Friend[] = [
        {
            id: '1',
            name: 'Sarah Johnson',
            status: 'Online',
            avatar: require('../../../../assets/images/Logo.png'),
            mutualFriends: 12,
        },
        {
            id: '2',
            name: 'Ethan Williams',
            status: 'Offline',
            avatar: require('../../../../assets/images/Logo.png'),
            mutualFriends: 5,
        },
        {
            id: '3',
            name: 'Maya Chen',
            status: 'Online',
            avatar: require('../../../../assets/images/Logo.png'),
            mutualFriends: 8,
        },
    ];

    const filteredFriends: Friend[] = friends.filter((f: Friend) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
        >

        <View style={styles.headerRow}>
            <Image
                source={require('../../../../assets/images/Logo.png')}
                style={styles.profileImage}
            />
            <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{'Your Name'}</Text>
                <Text style={styles.profileEmail}>{'your@email.com'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/account/settings')}>
                <FontAwesome name="gear" size={24} color="#ccc" />
            </TouchableOpacity>
        </View>

        <View style={styles.bioContainer}>
            <Text style={styles.bioText}>
                This is a sample bio. I'm a senior at ISU studying software
                engineering and passionate about cybersecurity and mobile dev.
            </Text>
        </View>

        <View style={styles.searchContainer}>
            <FontAwesome name="search" size={18} color="#888" />
            <TextInput
                style={styles.searchBar}
                placeholder="Search friends!"
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
        </View>

        <Text style={styles.friendsTitle}>Friends ({filteredFriends.length})</Text>

        {filteredFriends.length > 0 ? (
            filteredFriends.map((friend: Friend) => (
                <TouchableOpacity
                    key={friend.id}
                    style={styles.friendCard}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/account/${friend.id}`)}
                >
                <Image source={friend.avatar} style={styles.friendAvatar} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{friend.name}</Text>
                    <Text
                        style={[
                            styles.friendStatus,
                            { color: friend.status === 'Online' ? '#33CCFF' : '#aaa' },
                        ]}
                    >
                    {friend.status}
                    </Text>
                    <Text style={styles.mutualText}>
                        {friend.mutualFriends} mutual friends
                    </Text>
                </View>
                </TouchableOpacity>
            ))
        ) : (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No friends found :(</Text>
            </View>
        )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0b0b12',
        paddingHorizontal: 12,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
    },
    profileImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginRight: 12,
    },
    profileName: {
        color: 'white',
        fontSize: 20,
        fontWeight: '700',
    },
    profileEmail: {
        color: 'white',
        fontSize: 14,
    },
    bioContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        backgroundColor: "#0f172a",
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    bioText: {
        color: '#E5E5E5',
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
        marginTop: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    searchBar: {
        flex: 1,
        marginLeft: 8,
        color: 'white',
    },
    friendsTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    friendCard: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
        borderWidth: 1,
        borderColor: "#1f2937",
    },
    friendAvatar: {
        width: 55,
        height: 55,
        borderRadius: 50,
        marginRight: 12,
    },
    friendName: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    friendStatus: {
        fontSize: 13,
        marginTop: 2,
    },
    mutualText: {
        color: '#888',
        fontSize: 12,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: '#ccc',
        fontSize: 16,
    },
});