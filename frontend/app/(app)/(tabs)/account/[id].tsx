import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, ScrollView, StyleSheet,
    ActivityIndicator, FlatList, Modal, TextInput,
    TouchableWithoutFeedback, Animated, Alert
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

// Hooks & Services
import { useAuth } from '@/hooks/use-auth';
import {
    acceptFriendRequest, blockFriend, declineFriendRequest,
    getUserById, getUserFriends, getMutualFriends,
    removeFriend, sendFriendRequest
} from '@/services/userService';
import { Friend } from '@/types/types'

// UI & Theme
import { Theme } from '@/constants/theme';
import ErrorState from '@/components/ui/error-state';
import { FeatureCard } from '@/components/account/feature-card';
import { normalizeUserData } from '@/utils/user-mapping';

export default function FriendProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { userStatus } = useAuth();

    // --- Local State ---
    const [user, setUser] = useState<any | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [mutualFriends, setMutualFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    // Relation States
    const [isFriend, setIsFriend] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // UI States
    const [activeModal, setActiveModal] = useState<'none' | 'friends' | 'respond'>('none');
    const [searchQuery, setSearchQuery] = useState('');
    const scaleAnim = useRef(new Animated.Value(1)).current;

    // --- Core Data Fetching ---
    const fetchProfile = useCallback(async () => {
        if (!id || !userStatus?.userId) return;

        const targetId = Number(id);

        // REDIRECT logic: Move to absolute path to avoid "sticky" relative routes
        if (targetId === userStatus.userId) {
            router.replace('/(app)/(tabs)/account');
            return;
        }

        // 1. Reset state immediately to prevent data "leakage"
        setUser(null);
        setLoading(true);
        setError(false);

        try {
            const [userData, friendsList, mutualList, myFriends] = await Promise.all([
                getUserById(id),
                getUserFriends(id),
                getMutualFriends(userStatus.userId, id),
                getUserFriends(userStatus.userId)
            ]);

            // 2. Normalize and Set
            setUser(normalizeUserData(userData));
            setFriends(friendsList || []);
            setMutualFriends(mutualList || []);

            // 3. Determine Relationship Status
            const isAlreadyFriend = myFriends.some(f => f.id.toString() === id);
            setIsFriend(isAlreadyFriend);

            // Handle friendship status logic (Pending/Blocked)
            const outgoing = userData?.friendships_friendships_user_id_1Tousers?.find((r: any) => r.user_id_2 === userStatus.userId);
            const incoming = userData?.friendships_friendships_user_id_2Tousers?.find((r: any) => r.user_id_1 === userStatus.userId);
            const relation = outgoing || incoming;

            setIsBlocked(relation?.friendship_status_id === 4);
            setRequestSent(outgoing?.friendship_status_id === 1);
            setHasIncomingRequest(incoming?.friendship_status_id === 1);

        } catch (err) {
            console.error("Profile load error:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [id, userStatus?.userId]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // --- Handlers ---
    const handleFriendRequest = async () => {
        setActionLoading(true);
        try {
            await sendFriendRequest(userStatus!.userId!, Number(id));
            setRequestSent(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Trigger your toast here
        } finally {
            setActionLoading(false);
        }
    };

    // --- Conditional Returns ---
    if (loading) return <View style={styles.center}><ActivityIndicator color={Theme.dark.secondary} /></View>;
    if (error) return <ErrorState title="Profile not found" />;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>

                {/* Profile Header */}
                <View style={styles.headerRow}>
                    <Image source={user?.avatar || require('../../../../assets/images/Logo.png')} style={styles.profileImage} />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.name}</Text>
                        <Text style={styles.usernameText}>@{user?.username}</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <TouchableOpacity style={styles.statButton} onPress={() => setActiveModal('friends')}>
                        <Text style={styles.statNumber}>{friends.length}</Text>
                        <Text style={styles.statLabel}>total friends</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.statButton}>
                        <Text style={styles.statNumber}>{mutualFriends.length}</Text>
                        <Text style={styles.statLabel}>mutual</Text>
                    </TouchableOpacity>
                </View>

                {/* Body Content */}
                {isFriend ? (
                    <View>
                        <View style={styles.card}><Text style={styles.bioText}>{user?.bio || "No bio set."}</Text></View>
                        <View style={styles.gridRow}>
                            <FeatureCard title="fav. drink"><FontAwesome name="glass" size={24} color={Theme.dark.secondary} /></FeatureCard>
                            <FeatureCard title="streak">
                                <Text style={styles.streakEmoji}>🔥 {user?.streak || 0}</Text>
                            </FeatureCard>
                        </View>
                    </View>
                ) : (
                    <View style={styles.lockedContainer}>
                        <FeatureCard title="Profile Locked" style={{ height: 100 }}>
                            <Text style={styles.lockText}>Add as a friend to see streaks and drinks!</Text>
                        </FeatureCard>

                        <TouchableOpacity
                            style={[styles.mainButton, requestSent && styles.disabledButton]}
                            onPress={hasIncomingRequest ? () => setActiveModal('respond') : handleFriendRequest}
                            disabled={requestSent || actionLoading}
                        >
                            <Text style={styles.buttonText}>
                                {hasIncomingRequest ? "Respond to Request" : requestSent ? "Request Sent" : "Add Friend"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    // container: { flex: 1, backgroundColor: Theme.dark.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    // content: { padding: 20 },
    // headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    // profileImage: { width: 80, height: 80, borderRadius: 40, marginRight: 15 },
    // profileInfo: { flex: 1 },
    // profileName: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    // usernameText: { color: 'gray', fontSize: 16 },
    // statsRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
    // statButton: { flex: 1, backgroundColor: Theme.container.background, padding: 15, borderRadius: 12, alignItems: 'center' },
    // statNumber: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    // statLabel: { color: 'gray', fontSize: 12 },
    card: { backgroundColor: Theme.container.background, padding: 15, borderRadius: 12, marginBottom: 15 },
    // bioText: { color: 'white', fontStyle: 'italic' },
    // gridRow: { flexDirection: 'row', gap: 15 },
    mainButton: { backgroundColor: Theme.dark.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
    disabledButton: { backgroundColor: 'gray' },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    lockText: { color: 'gray', textAlign: 'center', fontSize: 12 },

    lockedContainer: {
        marginTop: 10,
        gap: 12,
    },
    streakEmoji: { fontSize: 28, color: Theme.dark.tertiary, fontWeight: 'bold' },

    // });

    // const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.dark.background,
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    profileImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 12,
        borderWidth: 2,
        borderColor: Theme.container.mainBorder,
    },
    profileName: {
        color: Theme.dark.white,
        fontSize: 22,
        fontWeight: 'bold',
    },
    usernameText: {
        color: Theme.container.inactiveText,
        fontSize: 14,
    },
    sideStatsContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    sideStatBox: {
        backgroundColor: Theme.container.background,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        alignItems: 'center',
        minWidth: 70,
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
    addFriendButton: {
        backgroundColor: Theme.dark.primary,
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: Theme.dark.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 6,
    },
    addFriendText: {
        color: Theme.dark.white,
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 1,
    },
    pokeButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Theme.dark.primary,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
    },
    pokeText: {
        color: Theme.dark.primary,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'lowercase',
    },
    friendActionRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    friendActionButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: Theme.container.inactiveBorder,
        backgroundColor: Theme.container.background,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    requestActionsRow: {
        flexDirection: 'column',
        // flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    requestActionButton: {
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        alignSelf: 'stretch',
        width: '100%',
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
        fontWeight: '700',
        fontSize: 14,
        textTransform: 'none',
    },
    blockActionButton: {
        borderColor: Theme.dark.error,
    },
    friendActionText: {
        color: Theme.container.titleText,
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'lowercase',
    },
    toastContainer: {
        position: 'absolute',
        top: '1%',
        alignSelf: 'center',
        backgroundColor: Theme.dark.primary,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        zIndex: 999,
        elevation: 10,
    },
    toastText: {
        color: Theme.dark.white,
        fontWeight: '700',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingModalContent: {
        width: '90%',
        maxHeight: '70%',
        backgroundColor: Theme.container.background,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        elevation: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: Theme.container.titleText,
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.search.background,
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 45,
        marginBottom: 15,
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
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    modalAvatar: {
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
    },
    emptyText: {
        color: Theme.container.inactiveText,
        fontSize: 16,
        textAlign: 'center',
        paddingVertical: 20,
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: 15,
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    statLabelSmall: {
        color: Theme.container.inactiveText,
        fontSize: 11,
        fontWeight: '600',
        // textTransform: 'uppercase',
        marginTop: 2,
    },
});