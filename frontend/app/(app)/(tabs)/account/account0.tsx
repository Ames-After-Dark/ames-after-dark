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
    PendingFriendRequest,
    getUserProfileByAuth
} from '@/services/userService';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';
import ErrorState from '@/components/ui/error-state';
import { Theme } from '@/constants/theme';
import { useAuth } from "@/hooks/use-auth"

// ─────────────────────────────────────────────────────────────────────────────
// FAV BAR CONFIG
// Defaults to Cys until the API provides the user's actual favorite bar.
// TODO: Replace with API call — fetch bar by ID and pull cover + logo URLs.
// ─────────────────────────────────────────────────────────────────────────────

type FavBar = {
    id: string;
    name: string;
    cover: ImageSourcePropType;
    logo: ImageSourcePropType;
};

const DEFAULT_FAV_BAR: FavBar = {
    id: 'cys',
    name: "Cy's Roost",
    cover: require('../../../../assets/images/covers/CysCover.jpg'),
    logo:  require('../../../../assets/images/logos/Cys_Roost.png'),
};

const AVATAR_OPTIONS: { id: string; source: ImageSourcePropType }[] = [
    { id: 'Boy_1',   source: require('../../../../assets/images/avatars/Boy_1.png') },
    { id: 'Boy_2',   source: require('../../../../assets/images/avatars/Boy_2.png') },
    { id: 'Boy_3',   source: require('../../../../assets/images/avatars/Boy_3.png') },
    { id: 'Boy_4',   source: require('../../../../assets/images/avatars/Boy_4.png') },
    { id: 'Boy_5',   source: require('../../../../assets/images/avatars/Boy_5.png') },
    { id: 'Boy_6',   source: require('../../../../assets/images/avatars/Boy_6.png') },
    { id: 'Boy_7',   source: require('../../../../assets/images/avatars/Boy_7.png') },
    { id: 'Boy_8',   source: require('../../../../assets/images/avatars/Boy_8.png') },
    { id: 'Boy_9',   source: require('../../../../assets/images/avatars/Boy_9.png') },
    { id: 'Boy_10',  source: require('../../../../assets/images/avatars/Boy_10.png') },
    { id: 'Girl_1',  source: require('../../../../assets/images/avatars/Girl_1.png') },
    { id: 'Girl_2',  source: require('../../../../assets/images/avatars/Girl_2.png') },
    { id: 'Girl_3',  source: require('../../../../assets/images/avatars/Girl_3.png') },
    { id: 'Girl_4',  source: require('../../../../assets/images/avatars/Girl_4.png') },
    { id: 'Girl_5',  source: require('../../../../assets/images/avatars/Girl_5.png') },
    { id: 'Girl_6',  source: require('../../../../assets/images/avatars/Girl_6.png') },
    { id: 'Girl_7',  source: require('../../../../assets/images/avatars/Girl_7.png') },
    { id: 'Girl_8',  source: require('../../../../assets/images/avatars/Girl_8.png') },
    { id: 'Girl_9',  source: require('../../../../assets/images/avatars/Girl_9.png') },
    { id: 'Girl_10', source: require('../../../../assets/images/avatars/Girl_10.png') },
];

const DRINK_OPTIONS: { id: string; source: ImageSourcePropType }[] = [
    { id: '01', source: require('../../../../assets/images/drinks/01.png') },
    { id: '02', source: require('../../../../assets/images/drinks/02.png') },
    { id: '03', source: require('../../../../assets/images/drinks/03.png') },
    { id: '04', source: require('../../../../assets/images/drinks/04.png') },
    { id: '05', source: require('../../../../assets/images/drinks/05.png') },
    { id: '06', source: require('../../../../assets/images/drinks/06.png') },
    { id: '07', source: require('../../../../assets/images/drinks/07.png') },
    { id: '08', source: require('../../../../assets/images/drinks/08.png') },
    { id: '09', source: require('../../../../assets/images/drinks/09.png') },
    { id: '10', source: require('../../../../assets/images/drinks/10.png') },
    { id: '11', source: require('../../../../assets/images/drinks/11.png') },
    { id: '12', source: require('../../../../assets/images/drinks/12.png') },
    { id: '13', source: require('../../../../assets/images/drinks/13.png') },
    { id: '14', source: require('../../../../assets/images/drinks/14.png') },
    { id: '15', source: require('../../../../assets/images/drinks/15.png') },
    { id: '16', source: require('../../../../assets/images/drinks/16.png') },
    { id: '17', source: require('../../../../assets/images/drinks/17.png') },
];

// Default to first image in each list
const DEFAULT_AVATAR = AVATAR_OPTIONS[0];
const DEFAULT_DRINK = DRINK_OPTIONS[0];

// ─────────────────────────────────────────────────────────────────────────────
// IMAGE PICKER MODAL
// Reusable for both avatar and drink selection
// ─────────────────────────────────────────────────────────────────────────────

type ImagePickerModalProps = {
    visible: boolean;
    title: string;
    options: { id: string; source: ImageSourcePropType }[];
    selectedId: string;
    onSelect: (item: { id: string; source: ImageSourcePropType }) => void;
    onClose: () => void;
};

function ImagePickerModal({
    visible,
    title,
    options,
    selectedId,
    onSelect,
    onClose,
}: ImagePickerModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={pickerStyles.overlay}>
                    <TouchableWithoutFeedback onPress={() => {}}>
                        <View style={pickerStyles.sheet}>
                            {/* Header */}
                            <View style={pickerStyles.header}>
                                <Text style={pickerStyles.title}>{title}</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Text style={pickerStyles.closeBtn}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Grid of options */}
                            <FlatList
                                data={options}
                                keyExtractor={(item) => item.id}
                                numColumns={3}
                                contentContainerStyle={pickerStyles.grid}
                                renderItem={({ item }) => {
                                    const isSelected = item.id === selectedId;
                                    return (
                                        <TouchableOpacity
                                            style={[
                                                pickerStyles.imageCell,
                                                isSelected && pickerStyles.imageCellSelected,
                                            ]}
                                            onPress={() => {
                                                onSelect(item);
                                                onClose();
                                            }}
                                        >
                                            <Image
                                                source={item.source}
                                                style={pickerStyles.optionImage}
                                            />
                                            {isSelected && (
                                                <View style={pickerStyles.checkBadge}>
                                                    <FontAwesome name="check" size={10} color="#fff" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                }}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const pickerStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Theme.container.background,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        paddingBottom: 32,
        maxHeight: '65%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    title: {
        color: Theme.dark.white,
        fontSize: 18,
        fontWeight: '700',
    },
    closeBtn: {
        color: Theme.container.inactiveText,
        fontSize: 22,
    },
    grid: {
        paddingHorizontal: 12,
        paddingTop: 12,
        gap: 10,
    },
    imageCell: {
        flex: 1,
        margin: 5,
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    imageCellSelected: {
        borderColor: Theme.dark.primary,
    },
    optionImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    checkBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: Theme.dark.primary,
        borderRadius: 999,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ACCOUNT SCREEN
// ─────────────────────────────────────────────────────────────────────────────

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

    // ── Image picker state ────────────────────────────────────────────────────
    const [selectedAvatar, setSelectedAvatar] = useState(DEFAULT_AVATAR);
    const [selectedDrink, setSelectedDrink] = useState(DEFAULT_DRINK);
    const [isAvatarPickerVisible, setAvatarPickerVisible] = useState(false);
    const [isDrinkPickerVisible, setDrinkPickerVisible] = useState(false);

    // ── Fav bar state ─────────────────────────────────────────────────────────
    // TODO: Once API is ready, fetch the user's fav bar and setFavBar(result)
    const [favBar, setFavBar] = useState<FavBar>(DEFAULT_FAV_BAR);
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {
        const fetchUser = async () => {
            setUserError(null);
            if (!userStatus?.userId) return;
            try {
                const accessToken = await getAccessToken();
                if (!accessToken) {
                    console.error('No access token available');
                    return;
                }
                const userData = await getUserProfileByAuth(accessToken);
                setUser(userData);

                // TODO: When API returns avatar/drink fields, initialize selections like:
                // if (userData.avatarId) {
                //     const match = AVATAR_OPTIONS.find(a => a.id === userData.avatarId);
                //     if (match) setSelectedAvatar(match);
                // }
                // if (userData.drinkId) {
                //     const match = DRINK_OPTIONS.find(d => d.id === userData.drinkId);
                //     if (match) setSelectedDrink(match);
                // }

            } catch (err) {
                setUserError(err instanceof Error ? err : new Error('Failed to fetch user'));
                console.error('Failed to fetch user:', err);
            } finally {
                setUserLoading(false);
            }
        };
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

    useEffect(() => {
        fetchPendingRequests();
    }, [fetchPendingRequests]);

    useFocusEffect(
        React.useCallback(() => {
            refetch();
            fetchPendingRequests();
        }, [fetchPendingRequests, refetch])
    );

    const handleAvatarSelect = (item: { id: string; source: ImageSourcePropType }) => {
        setSelectedAvatar(item);
        // TODO: Call API to persist avatar selection, e.g.:
        // await updateUserAvatar(userStatus.userId, item.id);
    };

    const handleDrinkSelect = (item: { id: string; source: ImageSourcePropType }) => {
        setSelectedDrink(item);
        // TODO: Call API to persist drink selection, e.g.:
        // await updateUserDrink(userStatus.userId, item.id);
    };

    const getOtherUserFromRequest = (request: PendingFriendRequest): Friend | null => {
        const left = request.users_friendships_user_id_1Tousers;
        const right = request.users_friendships_user_id_2Tousers;
        if (!left && !right) return null;
        if (request.user_id_1 === userStatus?.userId) return right ?? null;
        return left ?? null;
    };

    const handleRequestAction = async (request: PendingFriendRequest, action: 'accept' | 'decline' | 'block') => {
        if (!userStatus?.userId) return;
        const otherUser = getOtherUserFromRequest(request);
        const friendId = Number(otherUser?.id);
        if (!friendId || Number.isNaN(friendId)) return;
        setActionLoadingFriendId(friendId);
        try {
            if (action === 'accept') await acceptFriendRequest(userStatus.userId, friendId);
            else if (action === 'decline') await declineFriendRequest(userStatus.userId, friendId);
            else await blockFriend(userStatus.userId, friendId);
            setPendingRequests(prev => prev.filter(r => {
                const pendingOther = getOtherUserFromRequest(r);
                return Number(pendingOther?.id) !== friendId;
            }));
            if (action === 'accept') await refetch();
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

    if (userLoading || !userStatus?.userId) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', flex: 1 }]}>
                <ActivityIndicator size="large" color={Theme.dark.secondary} />
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
                {/* ── Profile header ── */}
                <View style={styles.headerRow}>
                    {/* Tap avatar to open picker */}
                    <TouchableOpacity
                        onPress={() => setAvatarPickerVisible(true)}
                        style={styles.avatarWrapper}
                    >
                        <View style={styles.avatarRingOuter}>
                            <View style={styles.avatarRingInner}>
                                <Image
                                    source={selectedAvatar.source}
                                    style={styles.profileImage}
                                />
                            </View>
                        </View>
                        <View style={styles.avatarEditBadge}>
                            <FontAwesome name="pencil" size={10} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Right side: name + stats */}
                    <View style={styles.headerRight}>
                        <View style={styles.headerNameRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.profileName}>{user?.name || username || 'Loading!'}</Text>
                                <Text style={styles.profileUserName}>@{username || 'Loading'}</Text>
                            </View>
                            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/account/settings')}>
                                <FontAwesome name="gear" size={24} color={Theme.container.inactiveText} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.statsRow}>
                            <TouchableOpacity style={styles.statButton} onPress={() => setModalVisible(true)}>
                                <Text style={styles.statNumber}>{friends.length}</Text>
                                <Text style={styles.statLabelSmall}>friends</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.statButton} onPress={() => setIsPendingModalVisible(true)}>
                                <Text style={styles.statNumber}>{pendingRequests.length}</Text>
                                <Text style={styles.statLabelSmall}>pending</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* ── Bio ── */}
                <View style={styles.bioContainer}>
                    <Text style={styles.bioText}>
                        {user?.bio || 'No bio yet. Add one to tell others about yourself!'}
                    </Text>
                </View>

                {/* ── Cards row ── */}
                <View style={styles.gridRow}>
                    {/* Fav drink — tap to open drink picker */}
                    <TouchableOpacity
                        style={styles.featureCard}
                        onPress={() => setDrinkPickerVisible(true)}
                    >
                        <Text style={styles.featureTitle}>Favorite Drink</Text>
                        <View style={styles.drinkImageWrapper}>
                            <Image
                                source={selectedDrink.source}
                                style={styles.drinkImage}
                            />
                            <View style={styles.drinkEditBadge}>
                                <FontAwesome name="pencil" size={10} color="#fff" />
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* Streak */}
                    <View style={styles.featureCard}>
                        <Text style={styles.featureTitle}>Streak</Text>
                        <View style={styles.streakContent}>
                            <Text style={styles.streakNumber}>🔥 {user?.streak || 0}</Text>
                            <Text style={styles.statLabel}>weekends out in a row</Text>
                        </View>
                    </View>
                </View>

                {/* ── Fav bar ── */}
                <View style={styles.largeCard}>
                    <Text style={styles.featureTitle}>Favorite Bar</Text>
                    <View style={styles.favBarImageWrapper}>
                        {/* Cover photo */}
                        <Image
                            source={favBar.cover}
                            style={styles.favBarCover}
                        />
                        {/* Dark gradient overlay */}
                        <View style={styles.favBarOverlay} />
                        {/* Logo + name bottom-left */}
                        <View style={styles.favBarInfo}>
                            <Image
                                source={favBar.logo}
                                style={styles.favBarLogo}
                            />
                            <Text style={styles.favBarName}>{favBar.name}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* ── Avatar picker ── */}
            <ImagePickerModal
                visible={isAvatarPickerVisible}
                title="Choose Profile Photo"
                options={AVATAR_OPTIONS}
                selectedId={selectedAvatar.id}
                onSelect={handleAvatarSelect}
                onClose={() => setAvatarPickerVisible(false)}
            />

            {/* ── Drink picker ── */}
            <ImagePickerModal
                visible={isDrinkPickerVisible}
                title="Choose Favorite Drink"
                options={DRINK_OPTIONS}
                selectedId={selectedDrink.id}
                onSelect={handleDrinkSelect}
                onClose={() => setDrinkPickerVisible(false)}
            />

            {/* ── Friends modal ── */}
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

            {/* ── Pending requests modal ── */}
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
        alignItems: 'stretch',
        paddingVertical: 10,
        paddingHorizontal: 4,
        gap: 12,
    },
    headerRight: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerNameRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    avatarWrapper: {
        position: 'relative',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    statButton: {
        flex: 1,
        backgroundColor: Theme.container.background,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        color: Theme.dark.white,
        fontSize: 18,
        fontWeight: '700',
    },
    statLabelSmall: {
        color: Theme.container.inactiveText,
        fontSize: 11,
        marginTop: 2,
    },
    avatarRingOuter: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: Theme.container.mainBorder,
        padding: 2,
    },
    avatarRingInner: {
        flex: 1,
        borderRadius: 57,
        overflow: 'hidden',
        backgroundColor: Theme.dark.background,
    },
    avatarInner: {
        flex: 1,
        borderRadius: 52,
        overflow: 'hidden',
        backgroundColor: Theme.dark.background,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 52,
        transform: [{ scale: 1.12 }],
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Theme.dark.primary,
        borderRadius: 999,
        width: 22,
        height: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.dark.background,
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
        marginBottom: 10,
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
        padding: 10,
        minHeight: 145,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    featureTitle: {
        color: Theme.dark.white,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    drinkImageWrapper: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 2,
        aspectRatio: 1,
        alignSelf: 'stretch',
    },
    drinkImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    drinkEditBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: Theme.dark.primary,
        borderRadius: 999,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.dark.background,
    },
    streakContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakNumber: {
        color: Theme.dark.tertiary,
        fontSize: 52,
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
        padding: 10,
        height: 180,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    favBarImageWrapper: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    favBarCover: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    favBarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    favBarInfo: {
        position: 'absolute',
        bottom: 10,
        left: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    favBarLogo: {
        width: 36,
        height: 36,
        borderRadius: 8,
        resizeMode: 'contain',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    favBarName: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
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
    friendsTitle: {
        color: Theme.dark.white,
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
        paddingHorizontal: 4,
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
        backgroundColor: Theme.dark.primary,
        borderColor: Theme.dark.primary,
    },
    declineButton: {
        backgroundColor: Theme.container.inactiveBorder,
        borderColor: Theme.container.inactiveBorder,
    },
    blockButton: {
        backgroundColor: Theme.dark.error,
        borderColor: Theme.dark.error,
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
});
