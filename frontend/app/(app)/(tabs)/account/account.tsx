import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ImageSourcePropType,
    ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';

import { UserProfile, UserDatabase, Friend } from '@/types/types';
import { useFriends } from '@/hooks/useFriends';
import {
    getUserById,
    getPendingFriendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    blockFriend,
    PendingFriendRequest
} from '@/services/userService';
import { Theme } from '@/constants/theme';

// TODO: Replace with actual user ID from auth/context
const CURRENT_USER_ID = 1;

export default function AccountScreen() {

    const [searchQuery, setSearchQuery] = useState<string>('');
    const [user, setUser] = useState<any | null>(null);
    const [userLoading, setUserLoading] = useState(true);
    const { friends, loading, error, refetch } = useFriends(CURRENT_USER_ID);
    const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([]);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [actionLoadingFriendId, setActionLoadingFriendId] = useState<number | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await getUserById(CURRENT_USER_ID);
                setUser(userData);
            } catch (err) {
                console.error('Failed to fetch user:', err);
            } finally {
                setUserLoading(false);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        const fetchPendingRequests = async () => {
            setPendingLoading(true);
            try {
                const data = await getPendingFriendRequests(CURRENT_USER_ID);
                setPendingRequests(data || []);
            } catch (err) {
                console.error('Failed to fetch pending requests:', err);
            } finally {
                setPendingLoading(false);
            }
        };

        fetchPendingRequests();
    }, []);

    const getOtherUserFromRequest = (request: PendingFriendRequest): Friend | null => {
        const left = request.users_friendships_user_id_1Tousers;
        const right = request.users_friendships_user_id_2Tousers;

        if (!left && !right) return null;
        if (request.user_id_1 === CURRENT_USER_ID) return right ?? null;
        return left ?? null;
    };

    const handleRequestAction = async (request: PendingFriendRequest, action: 'accept' | 'decline' | 'block') => {
        const otherUser = getOtherUserFromRequest(request);
        const friendId = Number(otherUser?.id);

        if (!friendId || Number.isNaN(friendId)) {
            return;
        }

        setActionLoadingFriendId(friendId);

        try {
            if (action === 'accept') {
                await acceptFriendRequest(CURRENT_USER_ID, friendId);
            } else if (action === 'decline') {
                await declineFriendRequest(CURRENT_USER_ID, friendId);
            } else {
                await blockFriend(CURRENT_USER_ID, friendId);
            }

            setPendingRequests(prev => prev.filter(r => {
                const pendingOther = getOtherUserFromRequest(r);
                return Number(pendingOther?.id) !== friendId;
            }));

            if (action === 'accept') {
                await refetch();
            }
        } catch (err) {
            console.error(`Failed to ${action} friend request:`, err);
        } finally {
            setActionLoadingFriendId(null);
        }
    };
    
    const filteredFriends: Friend[] = friends.filter((f: Friend) =>
        (f.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
        >

        <View style={styles.headerRow}>
            <Image
                source={user?.avatar || require('../../../../assets/images/Logo.png')}
                style={styles.profileImage}
            />
            <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user?.name || 'Loading...'}</Text>
                <Text style={styles.profileUserName}>{user?.username || ''}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/account/settings')}>
                <FontAwesome name="gear" size={24} color="#ccc" />
            </TouchableOpacity>
        </View>

        <View style={styles.bioContainer}>
            <Text style={styles.bioText}>
                {user?.bio || 'No bio yet. Add one to tell others about yourself!'}
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

        <Text style={styles.friendsTitle}>Pending Requests ({pendingRequests.length})</Text>

        {pendingLoading ? (
            <View style={styles.emptyContainer}>
                <ActivityIndicator size="small" color="#33CCFF" />
                <Text style={styles.emptyText}>Loading requests...</Text>
            </View>
        ) : pendingRequests.length > 0 ? (
            pendingRequests.map((request, index) => {
                const requestUser = getOtherUserFromRequest(request);
                const requestUserId = Number(requestUser?.id);
                const isActionLoading = actionLoadingFriendId === requestUserId;

                return (
                    <View key={`${request.user_id_1}-${request.user_id_2}-${index}`} style={styles.requestCard}>
                        <View style={styles.requestHeader}>
                            <Image
                                source={requestUser?.avatar || require('../../../../assets/images/Logo.png')}
                                style={styles.friendAvatar}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.friendName}>{requestUser?.name || 'Unknown user'}</Text>
                                <Text style={styles.friendStatus}>@{requestUser?.username || 'unknown'}</Text>
                            </View>
                        </View>

                        <View style={styles.requestActionsRow}>
                            <TouchableOpacity
                                style={[styles.requestActionButton, styles.acceptButton]}
                                disabled={isActionLoading}
                                onPress={() => handleRequestAction(request, 'accept')}
                            >
                                <Text style={styles.requestActionText}>Accept</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.requestActionButton, styles.declineButton]}
                                disabled={isActionLoading}
                                onPress={() => handleRequestAction(request, 'decline')}
                            >
                                <Text style={styles.requestActionText}>Decline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.requestActionButton, styles.blockButton]}
                                disabled={isActionLoading}
                                onPress={() => handleRequestAction(request, 'block')}
                            >
                                <Text style={styles.requestActionText}>Block</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                );
            })
        ) : (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No pending friend requests</Text>
            </View>
        )}

        {loading ? (
            <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color="#33CCFF" />
                <Text style={styles.emptyText}>Loading friends...</Text>
            </View>
        ) : error ? (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Failed to load friends</Text>
            </View>
        ) : filteredFriends.length > 0 ? (
            filteredFriends.map((friend: Friend, index: number) => (
                <TouchableOpacity
                    key={`${friend.id}-${index}`}
                    style={styles.friendCard}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/account/${friend.id}`)}
                >
                <Image 
                    source={friend.avatar || require('../../../../assets/images/Logo.png')} 
                    style={styles.friendAvatar} 
                />
                <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{friend.name || 'Unknown'}</Text>
                    <Text
                        style={[
                            styles.friendStatus,
                            { color: friend.status === 'Online' ? '#33CCFF' : '#aaa' },
                        ]}
                    >
                    {friend.status || 'Offline'}
                    </Text>
                    {friend.mutualFriends !== undefined && (
                        <Text style={styles.mutualText}>
                            {friend.mutualFriends} mutual friends
                        </Text>
                    )}
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
    profileUserName: {
        color: Theme.container.inactiveText,
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
    requestCard: {
        backgroundColor: '#0f172a',
        borderRadius: 12,
        padding: 12,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: '#1f2937',
    },
    requestHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    requestActionsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    requestActionButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    acceptButton: {
        backgroundColor: Theme.dark.primary, // '#0ea5e9',
        borderColor: Theme.dark.primary, // '#0ea5e9',
    },
    declineButton: {
        backgroundColor: '#374151',
        borderColor: '#4b5563',
    },
    blockButton: {
        backgroundColor: Theme.dark.error, // '#7f1d1d',
        borderColor: Theme.dark.error, // '#991b1b',
    },
    requestActionText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 12,
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
        color: Theme.container.inactiveText,
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