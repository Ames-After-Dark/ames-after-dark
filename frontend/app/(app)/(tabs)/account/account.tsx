import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
    Modal,
    FlatList,
    TouchableWithoutFeedback,
    RefreshControl,
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
    PendingFriendRequest,
    getUserProfileByAuth,
    getRecommendedFriends,
    sendFriendRequest,
    removeFriend
} from '@/services/userService';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';
import ErrorState from '@/components/ui/error-state';
import { Theme } from '@/constants/theme';
import { useAuth } from "@/hooks/use-auth"

export default function AccountScreen() {
    const { username, userStatus, getAccessToken } = useAuth()
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [user, setUser] = useState<any | null>(null);
    const [userLoading, setUserLoading] = useState(true);
    const { friends, loading, error, refetch } = useFriends(userStatus?.userId || 0);
    const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([]);
    const [pendingLoading, setPendingLoading] = useState(false);
    const [userError, setUserError] = useState<Error | null>(null);
    const [pendingError, setPendingError] = useState<Error | null>(null);
    const [actionLoadingFriendId, setActionLoadingFriendId] = useState<number | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);
    const [pendingSearchQuery, setPendingSearchQuery] = useState('');
    const [recommendedFriends, setRecommendedFriends] = useState<Friend[]>([]);
    const [recommendedLoading, setRecommendedLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUser = async () => {
        setUserError(null);
        if (!userStatus?.userId) return;
        try {
            const accessToken = await getAccessToken();
            if (!accessToken) {
                console.error('No access token available');
                return;
            }

            // Use getUserProfileByAuth to get the current user's profile with bio
            const userData = await getUserProfileByAuth(accessToken);
            console.log('Fetched current user profile:', {
                id: userData.id,
                username: userData.username,
                bio: userData.bio,
                hasBio: !!userData.bio
            });
            setUser(userData);
        } catch (err) {
            setUserError(err instanceof Error ? err : new Error('Failed to fetch user'));
            console.error('Failed to fetch user:', err);
        } finally {
            setUserLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [userStatus?.userId]);

    const fetchPendingRequests = React.useCallback(async () => {
        if (!userStatus?.userId) return;

        setPendingLoading(true);
        setPendingError(null);
        try {
            const data = await getPendingFriendRequests(userStatus.userId);
            setPendingRequests(data || []);
        } catch (err) {
            setPendingError(err instanceof Error ? err : new Error('Failed to fetch pending requests'));
            console.error('Failed to fetch pending requests:', err);
        } finally {
            setPendingLoading(false);
        }
    }, [userStatus?.userId]);

    const fetchRecommendedFriends = React.useCallback(async () => {
        if (!userStatus?.userId) return;

        setRecommendedLoading(true);
        try {
            const data = await getRecommendedFriends(userStatus.userId, 5);
            setRecommendedFriends(data || []);
        } catch (err) {
            console.error('Failed to fetch recommended friends:', err);
        } finally {
            setRecommendedLoading(false);
        }
    }, [userStatus?.userId]);

    useEffect(() => {
        fetchPendingRequests();
        fetchRecommendedFriends();
    }, [fetchPendingRequests, fetchRecommendedFriends]);

    useFocusEffect(
        React.useCallback(() => {
            refetch();
            fetchPendingRequests();
        }, [fetchPendingRequests, refetch])
    );

    // Manual refresh function for pull-to-refresh
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                fetchUser(),
                refetch(),
                fetchPendingRequests(),
                fetchRecommendedFriends()
            ]);
        } catch (err) {
            console.error('Failed to refresh:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const getOtherUserFromRequest = (request: PendingFriendRequest): Friend | null => {
        const left = request.users_friendships_user_id_1Tousers;
        const right = request.users_friendships_user_id_2Tousers;

        if (!left && !right) return null;
        if (request.user_id_1 === userStatus?.userId) return right ?? null;
        return left ?? null;
    };

    const isIncomingRequest = (request: PendingFriendRequest): boolean => {
        // user_id_1 = sender, user_id_2 = receiver
        // Incoming request = current user is the receiver (user_id_2)
        return request.user_id_2 === userStatus?.userId;
    };

    const handleRequestAction = async (request: PendingFriendRequest, action: 'accept' | 'decline' | 'block') => {
        if (!userStatus?.userId) {
            console.error('User not authenticated');
            return;
        }

        const otherUser = getOtherUserFromRequest(request);
        const friendId = Number(otherUser?.id);

        if (!friendId || Number.isNaN(friendId)) {
            return;
        }

        setActionLoadingFriendId(friendId);

        try {
            if (action === 'accept') {
                await acceptFriendRequest(userStatus.userId, friendId);
            } else if (action === 'decline') {
                await declineFriendRequest(userStatus.userId, friendId);
            } else {
                await blockFriend(userStatus.userId, friendId);
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

    const handleAddRecommendedFriend = async (friendId: number) => {
        if (!userStatus?.userId) {
            console.error('User not authenticated');
            return;
        }

        setActionLoadingFriendId(friendId);
        try {
            await sendFriendRequest(userStatus.userId, friendId);
            // Remove from recommendations after sending request
            setRecommendedFriends(prev => prev.filter(f => f.id !== friendId));
        } catch (err) {
            console.error('Failed to send friend request:', err);
        } finally {
            setActionLoadingFriendId(null);
        }
    };

    const filteredFriends: Friend[] = friends.filter((f: Friend) =>
        (f.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    const normalizedPendingQuery = pendingSearchQuery.trim().toLowerCase();
    const hasError = !!error || !!userError || !!pendingError || shouldForceErrorPage('account');

    if (hasError) {
        return (
            <View style={styles.container}>
                <ErrorState title="Unable to load account" subtitle="Please try again later." />
            </View>
        );
    }
    // Show loading if user data hasn't loaded yet
    if (userLoading || !userStatus?.userId) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
                <ActivityIndicator size="large" color={Theme.dark.secondary} />
            </View>
        );
    }

    return (
        <>
            {refreshing && (
                <View style={styles.refreshOverlay}>
                    <ActivityIndicator size="large" color={Theme.dark.secondary} />
                </View>
            )}
            <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={handleRefresh}
                        tintColor="#33CCFF"
                        title="Pull to refresh"
                        titleColor="#33CCFF"
                        colors={["#33CCFF"]}
                        progressBackgroundColor="#1a1a1a"
                    />
                }
            >

                <View style={styles.headerRow}>
                    <Image
                        source={user?.avatar || require('../../../../assets/images/Logo.png')}
                        style={styles.profileImage}
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.profileName}>{user?.name || username || 'Loading!'}</Text>
                        <Text style={styles.profileUserName}>@{username || 'Loading'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/account/settings')}>
                        <FontAwesome name="gear" size={24} color={Theme.container.inactiveText} />
                    </TouchableOpacity>
                </View>

                <View style={styles.statsRow}>
                    <TouchableOpacity
                        style={styles.statButton}
                        onPress={() => setModalVisible(true)}
                    >
                        <Text style={styles.statNumber}>{friends.length}</Text>
                        <Text style={styles.statLabelSmall}>friends</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.statButton}
                        onPress={() => setIsPendingModalVisible(true)}
                    >
                        <Text style={styles.statNumber}>{pendingRequests.length}</Text>
                        <Text style={styles.statLabelSmall}>pending</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.bioContainer}>
                    <Text style={styles.bioText}>
                        {user?.bio || 'No bio yet. Add one to tell others about yourself!'}
                    </Text>
                </View>

                <View style={styles.gridRow}>
                    <View style={styles.featureCard}>
                        <Text style={styles.featureTitle}>fav. drink</Text>
                        <View style={styles.placeholderPhoto}>
                            <FontAwesome name="glass" size={24} color={Theme.dark.secondary} />
                        </View>
                    </View>

                    <View style={styles.featureCard}>
                        <Text style={styles.featureTitle}>streak</Text>
                        <View style={styles.streakContent}>
                            <Text style={styles.streakNumber}>🔥 {user?.streak || 0}</Text>
                            <Text style={styles.statLabel}>weekends out in a row</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.largeCard}>
                    <Text style={styles.featureTitle}>fav. bar w/ official photo</Text>
                    <View style={styles.largePlaceholder}>
                        <FontAwesome name="map-marker" size={40} color={Theme.dark.muted} />
                    </View>
                </View>

            </ScrollView>

            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Friends</Text>
                                    <TouchableOpacity onPress={() => setModalVisible(false)}>
                                        <Text style={styles.closeButton}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalSearchContainer}>
                                    <FontAwesome name="search" size={18} color={Theme.search.inactiveInput} />
                                    <TextInput
                                        style={styles.modalSearchBar}
                                        placeholder="Search friends!"
                                        placeholderTextColor={Theme.search.inactiveInput}
                                        value={modalSearchQuery}
                                        onChangeText={setModalSearchQuery}
                                    />
                                </View>

                                <FlatList
                                    data={friends.filter((friend: Friend) =>
                                        friend.name?.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                                        friend.username?.toLowerCase().includes(modalSearchQuery.toLowerCase())
                                    )}
                                    keyExtractor={(item, index) => `${item.id}-${index}`}
                                    ListHeaderComponent={
                                        !modalSearchQuery && recommendedFriends.length > 0 ? (
                                            <View style={styles.recommendedSection}>
                                                <Text style={styles.recommendedTitle}>Recommended Friends</Text>
                                                {recommendedFriends.map((recommended) => (
                                                    <View key={recommended.id} style={styles.recommendedRow}>
                                                        <TouchableOpacity
                                                            style={styles.recommendedInfo}
                                                            onPress={() => {
                                                                setModalVisible(false);
                                                                router.push(`/account/${recommended.id}`);
                                                            }}
                                                        >
                                                            <Image
                                                                source={recommended.avatar || require('../../../../assets/images/Logo.png')}
                                                                style={styles.modalFriendAvatar}
                                                            />
                                                            <View style={{ flex: 1 }}>
                                                                <Text style={styles.modalFriendName}>{recommended.name || 'Unknown'}</Text>
                                                                <Text style={styles.modalFriendUsername}>@{recommended.username || 'unknown'}</Text>
                                                                {(recommended as any).mutualCount > 0 && (
                                                                    <Text style={styles.mutualFriendsText}>
                                                                        {(recommended as any).mutualCount} mutual friend{(recommended as any).mutualCount > 1 ? 's' : ''}
                                                                    </Text>
                                                                )}
                                                            </View>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity
                                                            style={[
                                                                styles.addButton,
                                                                actionLoadingFriendId === recommended.id && styles.addButtonDisabled
                                                            ]}
                                                            onPress={() => handleAddRecommendedFriend(Number(recommended.id))}
                                                            disabled={actionLoadingFriendId === recommended.id}
                                                        >
                                                            {actionLoadingFriendId === recommended.id ? (
                                                                <ActivityIndicator size="small" color="#fff" />
                                                            ) : (
                                                                <Text style={styles.addButtonText}>Add</Text>
                                                            )}
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                                <View style={styles.divider} />
                                                <Text style={styles.friendsSectionTitle}>Friends</Text>
                                            </View>
                                        ) : (
                                            !modalSearchQuery ? (
                                                <Text style={styles.friendsSectionTitle}>Friends</Text>
                                            ) : null
                                        )
                                    }
                                    renderItem={({ item: friend }) => (
                                        <View style={styles.modalFriendRow}>
                                            <TouchableOpacity
                                                style={styles.friendInfoSection}
                                                onPress={() => {
                                                    setModalVisible(false);
                                                    router.push(`/account/${friend.id}`);
                                                }}
                                            >
                                                <Image
                                                    source={friend.avatar || require('../../../../assets/images/Logo.png')}
                                                    style={styles.modalFriendAvatar}
                                                />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.modalFriendName}>{friend.name || 'Unknown'}</Text>
                                                    <Text style={styles.modalFriendUsername}>@{friend.username || 'unknown'}</Text>
                                                </View>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.removeButton, actionLoadingFriendId === friend.id && styles.addButtonDisabled]}
                                                onPress={async () => {
                                                    if (!userStatus?.userId) return;
                                                    setActionLoadingFriendId(Number(friend.id));
                                                    try {
                                                        await removeFriend(userStatus.userId, Number(friend.id));
                                                        await refetch();
                                                    } catch (err) {
                                                        console.error('Failed to remove friend:', err);
                                                    } finally {
                                                        setActionLoadingFriendId(null);
                                                    }
                                                }}
                                                disabled={actionLoadingFriendId === friend.id}
                                            >
                                                {actionLoadingFriendId === friend.id ? (
                                                    <ActivityIndicator size="small" color="#fff" />
                                                ) : (
                                                    <FontAwesome name="user-times" size={16} color="#FF453A" />
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    scrollEnabled
                                    nestedScrollEnabled
                                    showsVerticalScrollIndicator={true}
                                    ListEmptyComponent={<Text style={styles.emptyText}>No matches found</Text>}
                                />
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <Modal
                visible={isPendingModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsPendingModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsPendingModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback onPress={() => { }}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Pending Requests</Text>
                                    <TouchableOpacity onPress={() => setIsPendingModalVisible(false)}>
                                        <Text style={styles.closeButton}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.modalSearchContainer}>
                                    <FontAwesome name="search" size={18} color={Theme.search.inactiveInput} />
                                    <TextInput
                                        style={styles.modalSearchBar}
                                        placeholder="Search pending!"
                                        placeholderTextColor={Theme.search.inactiveInput}
                                        value={pendingSearchQuery}
                                        onChangeText={setPendingSearchQuery}
                                    />
                                </View>

                                {pendingLoading ? (
                                    <View style={styles.emptyContainer}>
                                        <ActivityIndicator size="small" color="#33CCFF" />
                                        <Text style={styles.emptyText}>Loading requests!</Text>
                                    </View>
                                ) : (() => {
                                    // Show all pending requests (incoming and outgoing)
                                    const filteredRequests = pendingRequests.filter((request) => {
                                        if (!normalizedPendingQuery) return true;
                                        const requestUser = getOtherUserFromRequest(request);
                                        return (
                                            (requestUser?.name ?? '').toLowerCase().includes(normalizedPendingQuery) ||
                                            (requestUser?.username ?? '').toLowerCase().includes(normalizedPendingQuery)
                                        );
                                    });

                                    return filteredRequests.length > 0 ? (
                                    <FlatList
                                        data={filteredRequests}
                                        keyExtractor={(item, index) => `${item.user_id_1}-${item.user_id_2}-${index}`}
                                        renderItem={({ item: request }) => {
                                            const requestUser = getOtherUserFromRequest(request);
                                            if (!requestUser) return null;

                                            const incoming = isIncomingRequest(request);

                                            return (
                                                <View style={styles.modalFriendRow}>
                                                    <TouchableOpacity
                                                        style={styles.friendInfoSection}
                                                        onPress={() => {
                                                            setIsPendingModalVisible(false);
                                                            router.push(`/account/${requestUser.id}`);
                                                        }}
                                                    >
                                                        <Image
                                                            source={requestUser.avatar || require('../../../../assets/images/Logo.png')}
                                                            style={styles.modalFriendAvatar}
                                                        />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.modalFriendName}>{requestUser.name || 'Unknown user'}</Text>
                                                            <Text style={styles.modalFriendUsername}>@{requestUser.username || 'unknown'}</Text>
                                                            <Text style={styles.pendingStatusText}>
                                                                {incoming ? 'Incoming friend request' : 'Friend request sent'}
                                                            </Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                    {incoming ? (
                                                        <View style={styles.requestActions}>
                                                            <TouchableOpacity
                                                                style={[styles.pendingAcceptButton, actionLoadingFriendId === requestUser.id && styles.addButtonDisabled]}
                                                                onPress={() => handleRequestAction(request, 'accept')}
                                                                disabled={actionLoadingFriendId === requestUser.id}
                                                            >
                                                                {actionLoadingFriendId === requestUser.id ? (
                                                                    <ActivityIndicator size="small" color="#fff" />
                                                                ) : (
                                                                    <FontAwesome name="check" size={16} color="#fff" />
                                                                )}
                                                            </TouchableOpacity>
                                                            <TouchableOpacity
                                                                style={[styles.pendingDeclineButton, actionLoadingFriendId === requestUser.id && styles.addButtonDisabled]}
                                                                onPress={() => handleRequestAction(request, 'decline')}
                                                                disabled={actionLoadingFriendId === requestUser.id}
                                                            >
                                                                <FontAwesome name="times" size={16} color="#FF453A" />
                                                            </TouchableOpacity>
                                                        </View>
                                                    ) : (
                                                        <TouchableOpacity
                                                            style={[styles.pendingCancelButton, actionLoadingFriendId === requestUser.id && styles.addButtonDisabled]}
                                                            onPress={() => handleRequestAction(request, 'decline')}
                                                            disabled={actionLoadingFriendId === requestUser.id}
                                                        >
                                                            {actionLoadingFriendId === requestUser.id ? (
                                                                <ActivityIndicator size="small" color="#FF453A" />
                                                            ) : (
                                                                <Text style={styles.cancelButtonText}>Cancel</Text>
                                                            )}
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            );
                                        }}
                                        scrollEnabled
                                        nestedScrollEnabled
                                        showsVerticalScrollIndicator={true}
                                        ListEmptyComponent={<Text style={styles.emptyText}>No matches found</Text>}
                                    />
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>no pending requests</Text>
                                    </View>
                                );
                                })()}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.dark.background,
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
        color: Theme.dark.white,
        fontSize: 20,
        fontWeight: '700',
    },
    profileUserName: {
        color: Theme.container.inactiveText,
        fontSize: 14,
    },
    bioContainer: {
        backgroundColor: Theme.container.background,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        marginBottom: 15,
    },
    bioText: {
        color: Theme.container.titleText,
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    gridRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
        gap: 15,
    },
    featureCard: {
        flex: 1,
        backgroundColor: Theme.container.background,
        borderRadius: 12,
        padding: 15,
        minHeight: 130,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    featureTitle: {
        color: Theme.dark.white,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    placeholderPhoto: {
        flex: 1,
        backgroundColor: Theme.search.background,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },
    streakContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakNumber: {
        color: Theme.dark.tertiary,
        fontSize: 32,
        fontWeight: 'bold',
    },
    statLabel: {
        color: Theme.container.inactiveText,
        fontSize: 12,
        textAlign: 'center',
    },
    largeCard: {
        backgroundColor: Theme.container.background,
        borderRadius: 12,
        padding: 15,
        height: 160,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    largePlaceholder: {
        flex: 1,
        backgroundColor: Theme.search.background,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verticalListContainer: {
        marginTop: 10,
        gap: 12,
    },
    wideFeatureCard: {
        backgroundColor: Theme.container.background,
        borderRadius: 16,
        padding: 22,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lockSubtext: {
        color: Theme.container.inactiveText,
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.search.background,
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40,
        marginTop: 10,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Theme.search.border,
    },
    searchBar: {
        flex: 1,
        marginLeft: 8,
        color: Theme.search.input,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginVertical: 16,
        paddingHorizontal: 4,
        gap: 12,
    },
    statButton: {
        flex: 1,
        backgroundColor: Theme.container.background,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        color: Theme.dark.white,
        fontSize: 24,
        fontWeight: '700',
    },
    statLabelSmall: {
        color: Theme.container.inactiveText,
        fontSize: 12,
        marginTop: 4,
    },
    friendsTitle: {
        color: Theme.dark.white,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        paddingHorizontal: 4,
    },
    friendCard: {
        backgroundColor: Theme.container.background,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 6,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    requestCard: {
        backgroundColor: Theme.container.background,
        borderRadius: 12,
        padding: 12,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
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
        backgroundColor: Theme.container.inactiveBorder,
        borderColor: Theme.container.inactiveBorder,
    },
    blockButton: {
        backgroundColor: Theme.dark.error, // '#7f1d1d',
        borderColor: Theme.dark.error, // '#991b1b',
    },
    requestActionText: {
        color: Theme.dark.white,
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
        color: Theme.container.activeText,
        fontSize: 16,
        fontWeight: '600',
    },
    friendStatus: {
        color: Theme.container.inactiveText,
        fontSize: 13,
        marginTop: 2,
    },
    mutualText: {
        color: Theme.container.inactiveText,
        fontSize: 12,
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 40,
    },
    emptyText: {
        color: Theme.container.inactiveText,
        fontSize: 16,
        textAlign: 'center',
        paddingVertical: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '90%',
        maxHeight: '70%',
        backgroundColor: Theme.container.background,
        borderRadius: 24,
        paddingTop: 16,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
        // borderBottomWidth: 1,
        // borderTopWidth: 1,
        borderColor: Theme.container.mainBorder,
        marginBottom: 16,
    },
    modalTitle: {
        color: Theme.container.titleText,
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeButton: {
        color: Theme.container.inactiveText,
        fontSize: 24,
        fontWeight: '400',
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.search.background,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 45,
        marginHorizontal: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Theme.search.border,
    },
    modalSearchBar: {
        flex: 1,
        marginLeft: 10,
        color: Theme.search.input,
        fontSize: 16,
    },
    modalFriendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    modalFriendAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    modalFriendName: {
        color: Theme.container.activeText,
        fontSize: 16,
        fontWeight: '600',
    },
    modalFriendUsername: {
        color: Theme.container.inactiveText,
        fontSize: 13,
        marginTop: 2,
    },
    recommendedSection: {
        paddingBottom: 8,
    },
    recommendedTitle: {
        color: Theme.container.titleText,
        fontSize: 16,
        fontWeight: 'bold',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    friendsSectionTitle: {
        color: Theme.container.titleText,
        fontSize: 16,
        fontWeight: 'bold',
        paddingHorizontal: 20,
        paddingVertical: 12,
        paddingTop: 16,
    },
    recommendedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderColor: Theme.container.mainBorder,
        justifyContent: 'space-between',
    },
    recommendedInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    mutualFriendsText: {
        color: Theme.container.inactiveText,
        fontSize: 11,
        marginTop: 2,
    },
    addButton: {
        backgroundColor: Theme.dark.secondary,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 60,
        alignItems: 'center',
    },
    addButtonDisabled: {
        opacity: 0.5,
    },
    addButtonText: {
        color: Theme.dark.white,
        fontSize: 14,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: Theme.container.mainBorder,
        marginTop: 8,
    },
    friendInfoSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    removeButton: {
        padding: 8,
        marginLeft: 8,
    },
    cancelButton: {
        backgroundColor: Theme.container.inactiveText,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        minWidth: 70,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#FF453A',
        fontSize: 14,
        fontWeight: '600',
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    pendingAcceptButton: {
        backgroundColor: Theme.dark.secondary,
        padding: 8,
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pendingDeclineButton: {
        backgroundColor: 'transparent',
        padding: 8,
        borderRadius: 20,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FF453A',
    },
    pendingCancelButton: {
        backgroundColor: 'transparent',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#FF453A',
        alignItems: 'center',
        justifyContent: 'center',
    },
    refreshOverlay: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 1000,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pendingStatusText: {
        color: Theme.container.inactiveText,
        fontSize: 11,
        marginTop: 2,
        fontStyle: 'italic',
    },
});