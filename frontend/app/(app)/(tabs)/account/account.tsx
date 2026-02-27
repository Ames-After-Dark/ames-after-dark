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
import { shouldForceErrorPage } from '@/config/dev-error-pages';
import ErrorState from '@/components/ui/error-state';
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
    const [userError, setUserError] = useState<Error | null>(null);
    const [pendingError, setPendingError] = useState<Error | null>(null);
    const [actionLoadingFriendId, setActionLoadingFriendId] = useState<number | null>(null);
    const [isModalVisible, setModalVisible] = useState(false);
    const [modalSearchQuery, setModalSearchQuery] = useState('');
    const [isPendingModalVisible, setIsPendingModalVisible] = useState(false);
    const [pendingSearchQuery, setPendingSearchQuery] = useState('');

    useEffect(() => {
        const fetchUser = async () => {
            setUserError(null);
            try {
                const userData = await getUserById(CURRENT_USER_ID);
                setUser(userData);
            } catch (err) {
                setUserError(err instanceof Error ? err : new Error('Failed to fetch user'));
                console.error('Failed to fetch user:', err);
            } finally {
                setUserLoading(false);
            }
        };
        fetchUser();
    }, []);

    const fetchPendingRequests = React.useCallback(async () => {
        setPendingLoading(true);
        setPendingError(null);
        try {
            const data = await getPendingFriendRequests(CURRENT_USER_ID);
            setPendingRequests(data || []);
        } catch (err) {
            setPendingError(err instanceof Error ? err : new Error('Failed to fetch pending requests'));
            console.error('Failed to fetch pending requests:', err);
        } finally {
            setPendingLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingRequests();
    }, [fetchPendingRequests]);

    useFocusEffect(
        React.useCallback(() => {
            refetch();
            fetchPendingRequests();
        }, [fetchPendingRequests, refetch])
    );

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
    const normalizedPendingQuery = pendingSearchQuery.trim().toLowerCase();
    const hasError = !!error || !!userError || !!pendingError || shouldForceErrorPage('account');

    if (hasError) {
        return (
            <View style={styles.container}>
                <ErrorState title="Unable to load account" subtitle="Please try again later." />
            </View>
        );
    }

    return (
        <>
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
                        <Text style={styles.profileName}>{user?.name || 'Loading!'}</Text>
                        <Text style={styles.profileUserName}>{user?.username || ''}</Text>
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
                                    renderItem={({ item: friend }) => (
                                        <TouchableOpacity
                                            style={styles.modalFriendRow}
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
                                    )}
                                    scrollEnabled
                                    nestedScrollEnabled
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
                                ) : pendingRequests.length > 0 ? (
                                    <FlatList
                                        data={pendingRequests.filter((request) => {
                                            if (!normalizedPendingQuery) return true;
                                            const requestUser = getOtherUserFromRequest(request);
                                            return (
                                                (requestUser?.name ?? '').toLowerCase().includes(normalizedPendingQuery) ||
                                                (requestUser?.username ?? '').toLowerCase().includes(normalizedPendingQuery)
                                            );
                                        })}
                                        keyExtractor={(item, index) => `${item.user_id_1}-${item.user_id_2}-${index}`}
                                        renderItem={({ item: request }) => {
                                            const requestUser = getOtherUserFromRequest(request);
                                            if (!requestUser) return null;

                                            return (
                                                <TouchableOpacity
                                                    style={styles.modalFriendRow}
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
                                                        <Text style={styles.modalFriendUsername}>@{requestUser.username || 'unknown'}</Text>
                                                        <Text style={styles.modalFriendName}>{requestUser.name || 'Unknown user'}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        }}
                                        scrollEnabled
                                        nestedScrollEnabled
                                        ListEmptyComponent={<Text style={styles.emptyText}>No matches found</Text>}
                                    />
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>no pending requests</Text>
                                    </View>
                                )}
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
});