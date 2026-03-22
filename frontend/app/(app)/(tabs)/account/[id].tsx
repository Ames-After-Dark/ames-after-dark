import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback, TouchableOpacity, Text, Animated } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';
import { Theme } from '@/constants/theme';
import ErrorState from '@/components/ui/error-state';
import { Friend } from '@/types/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// Hooks & Services
import { useProfileActions } from '@/hooks/useProfileActions';
import {
    getUserById,
    getUserFriends,
    getMutualFriends,
    getRecommendedFriends,
    getPendingFriendRequests,
} from '@/services/userService';

// Modular Components
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileGrid } from '@/components/profile/ProfileGrid';
import { ProfileActions } from '@/components/profile/ProfileActions';
import { ProfileListModal } from '@/components/profile/ProfileListModal';

export default function FriendProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    // const { userStatus } = useAuth();

    const { currentUser, userStatus } = useAuth();

    const isMe = useMemo(() => {
        return currentUser?.id === Number(id) || userStatus?.userId === Number(id);
    }, [id, currentUser, userStatus]);

    // --- Animation Refs for Toast ---
    const toastTranslateY = useRef(new Animated.Value(-20)).current;
    const toastOpacity = useRef(new Animated.Value(0)).current;

    // --- State ---
    const [user, setUser] = useState<any>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [mutualFriends, setMutualFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastIcon, setToastIcon] = useState('check');
    const [isRespondModalVisible, setIsRespondModalVisible] = useState(false);

    const [recommendedFriends, setRecommendedFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);

    const [relationship, setRelationship] = useState({
        isFriend: false,
        isBlocked: false,
        sentRequest: false,
        receivedRequest: false,
    });

    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: '',
        data: [] as any[]
    });

    // --- Initialize Toast Function ---
    const triggerToast = (message: string, icon: string = 'check') => {
        setToastMessage(message);
        setToastIcon(icon);
        setShowToast(true);
        toastTranslateY.setValue(-20);

        Animated.parallel([
            Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(toastTranslateY, { toValue: 50, friction: 5, useNativeDriver: true }),
        ]).start();

        setTimeout(() => {
            Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
                setShowToast(false);
            });
        }, 2500);
    };

    // --- Initialize the Hook ---
    const {
        handlePoke,
        handleAdd,
        handleConfirmBlock,
        handleUnblock,
        handlePendingDecision,
        handleRemove,
        loading: actionLoading
    } = useProfileActions(triggerToast);

    // const fetchProfile = async () => {
    //     if (!id || !userStatus?.userId) return;
    //     setLoading(true);
    //     try {
    //         const [userData, friendsData, mutualData, myFriends] = await Promise.all([
    //             getUserById(id),
    //             getUserFriends(id),
    //             getMutualFriends(userStatus.userId, id),
    //             getUserFriends(userStatus.userId)
    //         ]);

    //         setUser(userData);
    //         setFriends(friendsData || []);
    //         setMutualFriends(mutualData || []);

    //         const isFriend = myFriends.some(f => f.id.toString() === id);
    //         const outgoing = userData?.friendships_friendships_user_id_1Tousers?.find((r: any) => r.user_id_2 === userStatus.userId);
    //         const incoming = userData?.friendships_friendships_user_id_2Tousers?.find((r: any) => r.user_id_1 === userStatus.userId);

    //         setRelationship({
    //             isFriend,
    //             isBlocked: (outgoing?.friendship_status_id === 4 || incoming?.friendship_status_id === 4),
    //             sentRequest: Boolean(incoming?.friendship_status_id === 1),
    //             receivedRequest: Boolean(outgoing?.friendship_status_id === 1),
    //         });
    //     } catch (err) {
    //         console.error(err);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchProfile = async () => {
        if (!id || !userStatus?.userId) return;

        setLoading(true);

        try {
            // 1. If it's me, we only need my profile and my friends
            const [userData, friendsData, mutualData, pendingRequestsData] = await Promise.all([
                getUserById(id),
                getUserFriends(id),
                isMe ? Promise.resolve([]) : getMutualFriends(userStatus.userId, id),
                isMe ? getPendingFriendRequests(userStatus.userId) : Promise.resolve([]),
            ]);

            const formattedPending = (pendingRequestsData || []).map(req => {
                const isOutgoing = req.user_id_1 === userStatus.userId;
                const friend = isOutgoing
                    ? req.users_friendships_user_id_2Tousers
                    : req.users_friendships_user_id_1Tousers;

                return {
                    id: friend?.id,
                    name: friend?.name || 'Unknown User',
                    username: friend?.username || 'unknown',
                    avatar: friend?.avatar,
                    type: isOutgoing ? 'SENT' : 'RECEIVED'
                };
            });

            setUser(userData);
            setFriends(friendsData || []);
            setMutualFriends(mutualData || []);
            setPendingRequests(formattedPending);

            // 2. Relationship logic
            if (isMe) {

                const recs = await getRecommendedFriends(userStatus.userId); // Ensure this service exists
                setRecommendedFriends(recs || []);

                setRelationship({
                    isFriend: true,
                    isBlocked: false,
                    sentRequest: false,
                    receivedRequest: false,
                });
            } else {
                // Keep your existing relationship logic for others
                const myFriends = await getUserFriends(userStatus.userId);
                const isFriend = myFriends.some(f => f.id.toString() === id);
                const outgoing = userData?.friendships_friendships_user_id_1Tousers?.find((r: any) => r.user_id_2 === userStatus.userId);
                const incoming = userData?.friendships_friendships_user_id_2Tousers?.find((r: any) => r.user_id_1 === userStatus.userId);

                setRelationship({
                    isFriend,
                    isBlocked: (outgoing?.friendship_status_id === 4 || incoming?.friendship_status_id === 4),
                    sentRequest: Boolean(incoming?.friendship_status_id === 1),
                    receivedRequest: Boolean(outgoing?.friendship_status_id === 1),
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Replace your two existing useEffects with this one clean one:
    useEffect(() => {
        fetchProfile();
    }, [id, isMe]);

    // useEffect(() => { fetchProfile(); }, [id]);
    // useEffect(() => {
    //     if (isMe) {
    //         // Force the status to something that doesn't show "Add Friend"
    //         setStatus('ME');
    //     } else {
    //         // Only run your friendship check if it's NOT you
    //         fetchRelationshipStatus();
    //     }
    // }, [id, isMe]);

    const status = useMemo(() => {
        if (isMe) return 'ME';
        if (relationship.isBlocked) return 'BLOCKED';
        if (relationship.isFriend) return 'FRIEND';
        if (relationship.sentRequest) return 'PENDING_SENT';
        if (relationship.receivedRequest) return 'PENDING_RECEIVED';
        return 'STRANGER';
    }, [relationship]);

    // --- Unified Action Handler ---
    const handleAction = async (type: string, targetId?: number) => {
        const friendId = targetId || Number(id);
        const myId = userStatus!.userId!;

        if (type === 'poke') {
            handlePoke(user.name);
        } else if (type === 'primary') {
            // Inside handleAction in [id].tsx
            if (status === 'STRANGER') {
                await handleAdd(
                    myId,
                    friendId,
                    // This runs INSTANTLY
                    () => setRelationship(prev => ({ ...prev, sentRequest: true })),
                    // This runs after the server responds
                    fetchProfile
                );
            }
            if (status === 'PENDING_RECEIVED') setIsRespondModalVisible(true);
            if (status === 'BLOCKED') {
                await handleUnblock(myId, friendId, fetchProfile);
            }
        } else if (type === 'respond') {
            setIsRespondModalVisible(true);
        } else if (type === 'accept' || type === 'decline') {
            await handlePendingDecision(myId, friendId, type, fetchProfile);
            setIsRespondModalVisible(false);
        } else if (type === 'block') {
            handleConfirmBlock(myId, friendId, user.name, fetchProfile);
            setIsRespondModalVisible(false);
        } else if (type === 'remove' || type === 'cancel') {
            await handleRemove(myId, friendId, user.name, fetchProfile);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.dark.secondary} /></View>;
    if (!user) return <ErrorState title="User not found" subtitle="This profile might be private or deleted." />;

    return (
        <View style={styles.container}>

            <Stack.Screen
                options={{
                    headerShown: !isMe,
                    headerShadowVisible: false, // Optional: makes it cleaner
                }}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ProfileHeader
                    user={user}
                    isMe={isMe} // Tell the header if this is the logged-in user
                />

                {/* <ProfileStats
                    friendCount={friends.length}
                    isMe={isMe} // Stats might look different for you vs a stranger
                    mutualCount={mutualFriends.length}
                    secondLabel="mutual"
                    onPressFriends={() => setModalConfig({ visible: true, title: 'Friends', data: friends })}
                    onPressMutuals={() => setModalConfig({ visible: true, title: 'Mutual Friends', data: mutualFriends })}
                /> */}

                {/* <ProfileStats
                    friendCount={friends.length}
                    isMe={isMe}
                    mutualCount={isMe ? pendingRequests.length : mutualFriends.length} // Show pending count if it's me
                    secondLabel={isMe ? "pending" : "mutual"} // DYNAMIC LABEL
                    onPressFriends={() => setModalConfig({ visible: true, title: 'Friends', data: friends })}
                    onPressMutuals={() => setModalConfig({
                        visible: true,
                        title: isMe ? 'Pending Requests' : 'Mutual Friends', // DYNAMIC TITLE
                        data: isMe ? pendingRequests : mutualFriends // DYNAMIC DATA
                    })}
                /> */}

                <ProfileStats
                    friendCount={friends.length}
                    isMe={isMe}
                    mutualCount={isMe ? pendingRequests.length : mutualFriends.length}
                    secondLabel={isMe ? "pending" : "mutual"}
                    onPressFriends={() => setModalConfig({
                        visible: true,
                        title: 'Friends',
                        data: friends
                    })}
                    onPressMutuals={() => setModalConfig({
                        visible: true,
                        title: isMe ? 'Pending Requests' : 'Mutual Friends',
                        data: isMe ? pendingRequests : mutualFriends
                    })}
                />

                <ProfileHeader user={user} showBio={true} onlyBio={true} />

                {relationship.isFriend ? (
                    <ProfileGrid user={user} />
                ) : (
                    <View style={styles.lockedContainer}>
                        <Text style={styles.lockedText}>Add {user.name} to see their weekend stats!</Text>
                    </View>
                )}

                <ProfileActions
                    status={status as any}
                    loading={actionLoading}
                    userName={user.name}
                    onAction={handleAction}
                />
                {/* --- Profile Stats --- */}
                {/* <ProfileStats
                    friendCount={friends.length}
                    isMe={isMe}
                    // If it's me, this number doesn't matter as much, or you can pass pending count
                    mutualCount={mutualFriends.length}
                    onPressFriends={() => setModalConfig({ visible: true, title: 'Friends', data: friends })}
                    onPressMutuals={() => setModalConfig({ visible: true, title: 'Mutual Friends', data: mutualFriends })}
                />

                <ProfileHeader user={user} showBio={true} onlyBio={true} />

                {/* --- Content Grid --- *}
                {(relationship.isFriend || isMe) ? ( // Show grid if friend OR if it's me
                    <ProfileGrid user={user} />
                ) : (
                    <View style={styles.lockedContainer}>
                        <Text style={styles.lockedText}>Add {user.name} to see their weekend stats!</Text>
                    </View>
                )}

                {/* --- Action Buttons --- /}
                {isMe ?
                    (
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => Alert.alert("Edit Profile", "Navigate to settings here.")}
                        >
                            <Text style={styles.editButtonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    ) : (
                        <ProfileActions
                            status={status as any}
                            loading={actionLoading}
                            userName={user.name}
                            onAction={handleAction}
                        />
                    )} */}
            </ScrollView>

            {/* Modals & Response Popup */}
            <ProfileListModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                data={modalConfig.data}
                recommendedData={recommendedFriends} // UNCOMMENT AND PASS THIS
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                currentUserId={userStatus?.userId || null}
            />

            <Modal visible={isRespondModalVisible} transparent animationType="fade">
                <TouchableWithoutFeedback onPress={() => setIsRespondModalVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.responseCard}>
                            <Text style={styles.responseTitle}>Respond to {user?.name}</Text>
                            <TouchableOpacity style={[styles.responseBtn, styles.acceptBtn]} onPress={() => handleAction('accept')}>
                                <Text style={styles.btnText}>Accept Friend Request</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.responseBtn, styles.declineBtn]} onPress={() => handleAction('decline')}>
                                <Text style={styles.btnText}>Decline</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.responseBtn, styles.blockBtn]} onPress={() => handleAction('block')}>
                                <Text style={[styles.btnText, { color: '#FF453A' }]}>Block User</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsRespondModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            {/* --- TOAST UI COMPONENT --- */}
            {showToast && (
                <Animated.View
                    style={[
                        styles.toastContainer,
                        {
                            opacity: toastOpacity,
                            transform: [{ translateY: toastTranslateY }],
                        },
                    ]}
                >
                    <FontAwesome name={toastIcon as any} size={18} color="white" />
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    // container: { flex: 1, backgroundColor: Theme.dark.background },
    // scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 15 },
    container: {
        flex: 1,
        backgroundColor: Theme.dark.background
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 0,   // Change this to 0 to remove the gap
        paddingBottom: 40,
        gap: 15
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.dark.background },
    lockedContainer: { padding: 30, alignItems: 'center', backgroundColor: Theme.container.background, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: Theme.container.mainBorder },
    lockedText: { color: Theme.container.inactiveText, textAlign: 'center', fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    responseCard: { width: '85%', backgroundColor: Theme.container.background, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: Theme.container.mainBorder, alignItems: 'center' },
    responseTitle: { color: 'white', fontSize: 18, fontWeight: '700', marginBottom: 20 },
    responseBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
    acceptBtn: { backgroundColor: Theme.dark.primary },
    declineBtn: { backgroundColor: Theme.container.mainBorder },
    blockBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF453A' },
    btnText: { color: 'white', fontWeight: '700', fontSize: 15 },
    cancelBtn: { marginTop: 10 },
    cancelText: { color: Theme.container.inactiveText, fontSize: 14, fontWeight: '600' },
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
    editButton: {
        backgroundColor: Theme.container.mainBorder,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 10,
    },
    editButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
    },
});