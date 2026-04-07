import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback, TouchableOpacity, Text, Animated, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';
import { Theme } from '@/constants/theme';
import ErrorState from '@/components/ui/error-state';
import { Friend } from '@/types/types';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { shouldForceErrorPage } from '@/utils/dev-error-pages';

import { useProfileActions } from '@/hooks/useProfileActions';
import {
    getUserById,
    getUserFriends,
    getMutualFriends,
    getRecommendedFriends,
    getPendingFriendRequests,
    searchUsers,
    updateBioByAuth,
} from '@/services/userService';
import { apiFetch } from '@/services/apiClient';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileGrid } from '@/components/profile/ProfileGrid';
import { ProfileActions } from '@/components/profile/ProfileActions';
import { ProfileListModal } from '@/components/profile/ProfileListModal';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';

export default function FriendProfileScreen() {

    const insets = useSafeAreaInsets();
    const MAIN_HEADER_HEIGHT = 0;
    const TOTAL_TOP_PADDING = insets.top + MAIN_HEADER_HEIGHT;
    const BOTTOM_TAB_HEIGHT = 60;
    const TOP_OFFSET = insets.top + MAIN_HEADER_HEIGHT;

    const { id } = useLocalSearchParams<{ id: string }>();

    const { currentUser, userStatus, getAccessToken } = useAuth();

    const isMe = useMemo(() => {
        return currentUser?.id === Number(id) || userStatus?.userId === Number(id);
    }, [id, currentUser, userStatus]);

    const HEADER_HEIGHT = 60;
    const dynamicTopPadding = isMe ? insets.top + HEADER_HEIGHT : insets.top + HEADER_HEIGHT; // Extra 20 for spacing when viewing others' profiles

    const toastTranslateY = useRef(new Animated.Value(-20)).current;
    const toastOpacity = useRef(new Animated.Value(0)).current;

    const [user, setUser] = useState<any>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [mutualFriends, setMutualFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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

    const [isEditing, setIsEditing] = useState(false);
    const [isBioModalVisible, setIsBioModalVisible] = useState(false);
    const [bioText, setBioText] = useState('');

    const [modalConfig, setModalConfig] = useState({
        visible: false,
        title: '',
        data: [] as any[]
    });

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

    const {
        handlePoke,
        handleAdd,
        handleConfirmBlock,
        handleUnblock,
        handlePendingDecision,
        handleRemove,
        handleCancelRequest,
        loading: actionLoading
    } = useProfileActions(triggerToast);

    const fetchProfile = async () => {

        if (!id || !userStatus?.userId) {

            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {

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

            if (isMe) {

                const recs = await getRecommendedFriends(userStatus.userId);
                setRecommendedFriends(recs || []);

                setRelationship({
                    isFriend: true,
                    isBlocked: false,
                    sentRequest: false,
                    receivedRequest: false,
                });
            } else {
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
            setError('Unable to load account and friends right now.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [id, isMe]);

    useEffect(() => {
        if (!modalConfig.visible) return;

        if (modalConfig.title === 'Friends') {
            setModalConfig(prev => ({ ...prev, data: friends }));
            return;
        }

        if (modalConfig.title === 'Pending Requests') {
            setModalConfig(prev => ({ ...prev, data: pendingRequests }));
            return;
        }

        if (modalConfig.title === 'Mutual Friends') {
            setModalConfig(prev => ({ ...prev, data: mutualFriends }));
        }
    }, [modalConfig.visible, modalConfig.title, friends, pendingRequests, mutualFriends]);

    const status = useMemo(() => {
        if (isMe) return 'SELF';
        if (relationship.isBlocked) return 'BLOCKED';
        if (relationship.isFriend) return 'FRIEND';
        if (relationship.sentRequest) return 'PENDING_SENT';
        if (relationship.receivedRequest) return 'PENDING_RECEIVED';
        return 'STRANGER';
    }, [relationship, isMe]);

    const hasForcedError = shouldForceErrorPage(isMe ? 'account' : 'friendProfile');

    const handleAction = async (type: string, targetId?: number, targetNameFromModal?: string) => {
        const friendId = targetId || Number(id);
        const myId = userStatus!.userId!;
        const isRecommendedAdd = type === 'primary' && typeof targetId === 'number' && isMe;

        const targetName = targetNameFromModal || user?.name || "this user";

        if (type === 'poke') {
            handlePoke(user.name);
        } else if (type === 'primary') {

            if (status === 'STRANGER' || isRecommendedAdd) {

                await handleAdd(
                    myId,
                    friendId,
                    () => {
                        triggerToast(`Friend request sent to ${targetName}`);
                    },
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
        } else if (type === 'remove') {
            handleRemove(myId, friendId, targetName, fetchProfile);
        } else if (type === 'cancel') {
            Alert.alert(
                "Cancel Request",
                `Are you sure you want to cancel your request to ${targetName}?`,
                [
                    { text: "Back", style: "cancel" },
                    {
                        text: "Yes",
                        style: "destructive",
                        onPress: async () => {
                            setPendingRequests(prev => prev.filter(req => req.id !== friendId));
                            setModalConfig(prev => {
                                if (prev.title !== 'Pending Requests') return prev;
                                return {
                                    ...prev,
                                    data: prev.data.filter((req: any) => req.id !== friendId)
                                };
                            });

                            await handleCancelRequest(myId, friendId, targetName, fetchProfile);
                        }
                    }
                ]
            );
        }
    };

    if (loading) {
        return <ProfileSkeleton />;
    }

    if (!user || hasForcedError) {
        return <ErrorState title="User not found" subtitle="This profile might be private or deleted." />;
    }

    if (error || hasForcedError) {
        return <ErrorState title="Unable to load account" subtitle={error || 'Please try again later.'} />;
    }

    return (
        <View style={styles.container}>

            <Stack.Screen options={{ headerShown: false }} />

            <Stack.Screen
                // options={{
                //     headerShown: !isMe,
                //     headerShadowVisible: false,
                // }}
                options={{
                    // headerShown: !isMe, // Only show for friends
                    headerTransparent: true,
                    headerTitle: "",
                    headerTintColor: Theme.dark.white, // Ensure back button is white
                    headerLeft: () => (
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={{ marginLeft: 10, marginTop: 10 }} // Adjust for spacing
                        >
                            <FontAwesome name="chevron-left" size={20} color={Theme.dark.white} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView
                contentContainerStyle={{
                    paddingTop: dynamicTopPadding,
                    paddingBottom: BOTTOM_TAB_HEIGHT + insets.bottom + 20, // Extra 20 for breathing room
                    paddingHorizontal: 20,
                    gap: 15
                }}
            >
                <ProfileHeader
                    user={user}
                    isMe={isMe}
                    showFriendStats={relationship.isFriend}
                    isEditing={isEditing}
                    onRequestEdit={() => setIsEditing(true)}
                    onSave={() => setIsEditing(false)}
                    friendCount={friends.length}
                    mutualCount={isMe ? pendingRequests.length : mutualFriends.length}
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

                <ProfileHeader
                    user={user}
                    showBio={true}
                    onlyBio={true}
                    isMe={isMe}
                    isEditing={isEditing}
                    onEditBio={() => {
                        setBioText(user?.bio || '');
                        setIsBioModalVisible(true);
                    }}
                />

                {relationship.isFriend ? (
                    <ProfileGrid user={user} isMe={isMe} isEditing={isEditing} />
                ) : (
                    <View style={styles.lockedContainer}>
                        <Text style={styles.lockedText}>Add {user.name} to see their weekend stats!</Text>
                    </View>
                )}

                {!isMe && (
                    <ProfileActions
                        status={status as any}
                        loading={actionLoading}
                        userName={user?.name ?? undefined}
                        onAction={handleAction}
                    />
                )}

            </ScrollView>

            {!isMe && (
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { top: insets.top + 10 }]}
                >
                    <FontAwesome name="chevron-left" size={20} color={Theme.dark.white} />
                </TouchableOpacity>
            )}

            <ProfileListModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                data={modalConfig.data}
                recommendedData={recommendedFriends}
                onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
                currentUserId={userStatus?.userId || null}
                existingFriendIds={friends.map(friend => Number(friend.id))}
                onSearch={async (query: string) => {
                    if (!userStatus?.userId) return [];
                    return await searchUsers(query, userStatus.userId);
                }}

                onCancelRequest={(targetId, targetName) => handleAction('cancel', targetId, targetName)}
                onAcceptRequest={(targetId, targetName) => handleAction('accept', targetId, targetName)}
                onDeclineRequest={(targetId, targetName) => handleAction('decline', targetId, targetName)}

                onAddRecommended={(targetId, targetName) => handleAction('primary', targetId, targetName)}

                actionLoadingId={null}
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
                                <Text style={[styles.btnText, { color: Theme.dark.error }]}>Block User</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsRespondModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Bio Edit Modal */}
            <Modal visible={isBioModalVisible} transparent animationType="fade">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TouchableWithoutFeedback onPress={() => setIsBioModalVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.responseCard}>
                                    <Text style={styles.responseTitle}>Edit Bio</Text>
                                    <TextInput
                                        style={styles.bioInput}
                                        value={bioText}
                                        onChangeText={setBioText}
                                        placeholder="Tell people about yourself..."
                                        placeholderTextColor={Theme.container.inactiveText}
                                        multiline
                                        maxLength={200}
                                        autoFocus
                                    />
                                    <Text style={styles.bioCharCount}>{bioText.length}/200</Text>
                                    <TouchableOpacity
                                        style={[styles.responseBtn, styles.acceptBtn]}
                                        onPress={async () => {
                                            try {
                                                const accessToken = await getAccessToken();
                                                if (!accessToken) throw new Error('No access token');
                                                await updateBioByAuth(accessToken, bioText);
                                                setUser((prev: any) => ({ ...prev, bio: bioText }));
                                                setIsBioModalVisible(false);
                                                triggerToast('Bio updated!');
                                            } catch {
                                                triggerToast('Failed to save bio');
                                            }
                                        }}
                                    >
                                        <Text style={styles.btnText}>Save Bio</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsBioModalVisible(false)}>
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </Modal>

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
                    <View style={styles.toastIconWrap}>
                        <FontAwesome name={toastIcon as any} size={14} color={Theme.dark.primary} />
                    </View>
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.dark.background
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 0,
        paddingBottom: 40,
        gap: 15
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Theme.dark.background
    },
    lockedContainer: {
        padding: 30,
        alignItems: 'center',
        backgroundColor: Theme.container.background,
        borderRadius: 20,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: Theme.container.mainBorder
    },
    lockedText: {
        color: Theme.container.inactiveText,
        textAlign: 'center',
        fontSize: 14
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    responseCard: {
        width: '85%',
        backgroundColor: Theme.container.background,
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        alignItems: 'center'
    },
    responseTitle: {
        color: Theme.dark.white,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20
    },
    responseBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10
    },
    acceptBtn: {
        backgroundColor: Theme.dark.primary
    },
    declineBtn: {
        backgroundColor: Theme.container.mainBorder
    },
    blockBtn: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Theme.dark.error,
    },
    btnText: {
        color: Theme.dark.white,
        fontWeight: '700',
        fontSize: 15
    },
    cancelBtn: {
        marginTop: 10
    },
    cancelText: {
        color: Theme.container.inactiveText,
        fontSize: 14,
        fontWeight: '600'
    },
    toastContainer: {
        position: 'absolute',
        top: '1%',
        alignSelf: 'center',
        backgroundColor: Theme.container.background,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        zIndex: 999,
        elevation: 10,
    },
    toastIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 999,
        backgroundColor: Theme.dark.background,
        borderWidth: 1,
        borderColor: Theme.dark.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toastText: {
        color: Theme.dark.white,
        fontWeight: '600',
        fontSize: 14,
    },
    bioInput: {
        width: '100%',
        backgroundColor: Theme.dark.background,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        borderRadius: 12,
        padding: 12,
        color: Theme.dark.white,
        fontSize: 14,
        lineHeight: 20,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 6,
    },
    bioCharCount: {
        color: Theme.container.inactiveText,
        fontSize: 12,
        alignSelf: 'flex-end',
        marginBottom: 16,
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
    backButton: {
        position: 'absolute',
        left: 10,
        zIndex: 99, // Ensures it sits ABOVE the avatar/bio
        padding: 10, // Increases the "Touch Target" (Better UX!)
        backgroundColor: 'rgba(0,0,0,0.3)', // Optional: makes it visible over any background
        borderRadius: 20,
    },
});