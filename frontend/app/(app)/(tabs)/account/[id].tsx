import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback, TouchableOpacity, Text, Animated } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import { useAuth } from '@/hooks/use-auth';
import { Theme } from '@/constants/theme';
import ErrorState from '@/components/ui/error-state';
import { Friend } from '@/types/types';

// Hooks & Services
import { useProfileActions } from '@/hooks/useProfileActions';
import {
    getUserById,
    getUserFriends,
    getMutualFriends,
} from '@/services/userService';

// Modular Components
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfileGrid } from '@/components/profile/ProfileGrid';
import { ProfileActions } from '@/components/profile/ProfileActions';
import { ProfileListModal } from '@/components/profile/ProfileListModal';

export default function FriendProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { userStatus } = useAuth();

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
    const { handlePoke, handleAdd, handleConfirmBlock, handlePendingDecision, loading: actionLoading } = useProfileActions(triggerToast);

    const fetchProfile = async () => {
        if (!id || !userStatus?.userId) return;
        setLoading(true);
        try {
            const [userData, friendsData, mutualData, myFriends] = await Promise.all([
                getUserById(id),
                getUserFriends(id),
                getMutualFriends(userStatus.userId, id),
                getUserFriends(userStatus.userId)
            ]);

            setUser(userData);
            setFriends(friendsData || []);
            setMutualFriends(mutualData || []);

            const isFriend = myFriends.some(f => f.id.toString() === id);
            const outgoing = userData?.friendships_friendships_user_id_1Tousers?.find((r: any) => r.user_id_2 === userStatus.userId);
            const incoming = userData?.friendships_friendships_user_id_2Tousers?.find((r: any) => r.user_id_1 === userStatus.userId);

            setRelationship({
                isFriend,
                isBlocked: (outgoing?.friendship_status_id === 4 || incoming?.friendship_status_id === 4),
                sentRequest: Boolean(incoming?.friendship_status_id === 1),
                receivedRequest: Boolean(outgoing?.friendship_status_id === 1),
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, [id]);

    const status = useMemo(() => {
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
            if (status === 'STRANGER') await handleAdd(myId, friendId);
            if (status === 'PENDING_RECEIVED') setIsRespondModalVisible(true);
            // Add unblock logic here if needed
        } else if (type === 'respond') {
            setIsRespondModalVisible(true);
        } else if (type === 'accept' || type === 'decline') {
            await handlePendingDecision(myId, friendId, type, fetchProfile);
            setIsRespondModalVisible(false);
        } else if (type === 'block') {
            handleConfirmBlock(myId, friendId, user.name, fetchProfile);
            setIsRespondModalVisible(false);
        }
    };

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.dark.secondary} /></View>;
    if (!user) return <ErrorState title="User not found" subtitle="This profile might be private or deleted." />;

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <ProfileHeader user={user} showBio={false} />

                <ProfileStats
                    friendCount={friends.length}
                    mutualCount={mutualFriends.length}
                    secondLabel="mutual"
                    onPressFriends={() => setModalConfig({ visible: true, title: 'Friends', data: friends })}
                    onPressMutuals={() => setModalConfig({ visible: true, title: 'Mutual Friends', data: mutualFriends })}
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
            </ScrollView>

            {/* Modals & Response Popup */}
            <ProfileListModal
                visible={modalConfig.visible}
                title={modalConfig.title}
                data={modalConfig.data}
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
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Theme.dark.background },
    scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 15 },
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
});

// import React, { useState, useEffect, useMemo } from 'react';
// import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, Modal, TouchableWithoutFeedback, TouchableOpacity, Text } from 'react-native';
// import { useLocalSearchParams, router } from 'expo-router';
// import * as Haptics from 'expo-haptics';

// import { useAuth } from '@/hooks/use-auth';
// import { Theme } from '@/constants/theme';
// import ErrorState from '@/components/ui/error-state';
// import { Friend, PendingFriendRequest } from '@/types/types';

// // Import our new Modular Components
// import { ProfileHeader } from '@/components/profile/ProfileHeader';
// import { ProfileStats } from '@/components/profile/ProfileStats';
// import { ProfileGrid } from '@/components/profile/ProfileGrid';
// import { ProfileActions } from '@/components/profile/ProfileActions';
// import { ProfileListModal } from '@/components/profile/ProfileListModal';

// import {
//     getUserById,
//     getUserFriends,
//     getMutualFriends,
//     sendFriendRequest,
//     acceptFriendRequest,
//     declineFriendRequest,
//     removeFriend,
//     blockFriend
// } from '@/services/userService';

// export default function FriendProfileScreen() {
//     const { id } = useLocalSearchParams<{ id: string }>();
//     const { userStatus } = useAuth();

//     // Data State
//     const [user, setUser] = useState<any>(null);
//     const [friends, setFriends] = useState<Friend[]>([]);
//     const [mutualFriends, setMutualFriends] = useState<Friend[]>([]);

//     // UI State
//     const [loading, setLoading] = useState(true);
//     const [actionLoading, setActionLoading] = useState(false);
//     const [relationship, setRelationship] = useState({
//         isFriend: false,
//         isBlocked: false,
//         sentRequest: false,
//         receivedRequest: false,
//     });

//     const [isModalVisible, setModalVisible] = useState(false);
//     const [modalData, setModalData] = useState({ title: '', list: [] });

//     const [isRespondModalVisible, setIsRespondModalVisible] = useState(false);

//     // Define a Union type to handle both friends and requests
//     type ModalData = Friend | PendingFriendRequest | any;

//     const [modalConfig, setModalConfig] = useState<{
//         visible: boolean;
//         title: string;
//         data: ModalData[]
//     }>({
//         visible: false,
//         title: '',
//         data: [] // TypeScript now knows this is a ModalData[]
//     });

//     const fetchProfile = async () => {
//         if (!id || !userStatus?.userId) return;
//         setLoading(true);
//         try {
//             const [userData, friendsData, mutualData, myFriends] = await Promise.all([
//                 getUserById(id),
//                 getUserFriends(id),
//                 getMutualFriends(userStatus.userId, id),
//                 getUserFriends(userStatus.userId)
//             ]);

//             setUser(userData);
//             setFriends(friendsData || []);
//             setMutualFriends(mutualData || []);

//             // Determine Relationship Status
//             const isFriend = myFriends.some(f => f.id.toString() === id);
//             const outgoing = userData?.friendships_friendships_user_id_1Tousers?.find((r: any) => r.user_id_2 === userStatus.userId);
//             const incoming = userData?.friendships_friendships_user_id_2Tousers?.find((r: any) => r.user_id_1 === userStatus.userId);

//             setRelationship({
//                 isFriend,
//                 isBlocked: (outgoing?.friendship_status_id === 4 || incoming?.friendship_status_id === 4),
//                 sentRequest: Boolean(incoming?.friendship_status_id === 1),
//                 receivedRequest: Boolean(outgoing?.friendship_status_id === 1),
//             });
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     useEffect(() => { fetchProfile(); }, [id]);

//     // Computed Status for ProfileActions
//     const status = useMemo(() => {
//         if (relationship.isBlocked) return 'BLOCKED';
//         if (relationship.isFriend) return 'FRIEND';
//         if (relationship.sentRequest) return 'PENDING_SENT';
//         if (relationship.receivedRequest) return 'PENDING_RECEIVED';
//         return 'STRANGER';
//     }, [relationship]);

//     const handleAction = async (type: string, targetId?: number) => {
//         const friendId = targetId || Number(id); // Use passed ID (for lists) or page ID

//         switch (type) {
//             case 'poke':
//                 handlePoke();
//                 break;

//             case 'primary':
//                 if (status === 'STRANGER') await handleAddFriend();
//                 if (status === 'PENDING_RECEIVED') setIsRespondModalVisible(true);
//                 if (status === 'BLOCKED') await handleUnblockUser();
//                 break;

//             case 'respond':
//                 setIsRespondModalVisible(true);
//                 break;

//             case 'accept':
//                 await handlePendingDecision(friendId, 'accept');
//                 setIsRespondModalVisible(false);
//                 break;

//             case 'decline':
//                 await handlePendingDecision(friendId, 'decline');
//                 setIsRespondModalVisible(false);
//                 break;

//             case 'block':
//                 await handleBlockFriend(); // This already has your Alert.alert built-in
//                 setIsRespondModalVisible(false);
//                 break;

//             case 'remove':
//                 await handleRemoveFriend();
//                 break;

//             case 'cancel':
//                 // You can use handleRemoveFriend here because removing a
//                 // pending request is the same DB action as removing a friend
//                 await handleRemoveFriend();
//                 break;
//         }

//         await fetchProfile(); // Always refresh data after an action
//     };

//     if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={Theme.dark.secondary} /></View>;
//     if (!user) return <ErrorState title="User not found" subtitle="This profile might be private or deleted." />;

//     return (
//         <ScrollView
//             style={styles.container}
//             contentContainerStyle={styles.scrollContent} // Updated this!
//         >
//             {/* 1. ProfileHeader - Top part only */}
//             <ProfileHeader
//                 user={user}
//                 showBio={false}
//             />

//             {/* 2. Stats - Mutuals/Friends */}
//             <ProfileStats
//                 friendCount={friends.length}
//                 mutualCount={mutualFriends.length}
//                 secondLabel="mutual"
//                 onPressFriends={() => setModalConfig({ visible: true, title: 'Friends', data: friends })}
//                 onPressMutuals={() => setModalConfig({ visible: true, title: 'Mutual Friends', data: mutualFriends })}
//             />

//             {/* 3. Bio - Shows if they are a friend OR if you want it public */}
//             <ProfileHeader
//                 user={user}
//                 showBio={true}
//                 onlyBio={true}
//             />

//             {/* 4. Relationship Dependent Content */}
//             {relationship.isFriend ? (
//                 <ProfileGrid user={user} />
//             ) : (
//                 <View style={styles.lockedContainer}>
//                     {/* Optional: Add a 'Private Profile' lock icon here */}
//                 </View>
//             )}

//             {/* 5. Action Buttons (Poke, Add, Respond) */}
//             <ProfileActions
//                 status={status as any}
//                 loading={actionLoading}
//                 userName={user.name}
//                 onAction={handleAction}
//             />

//             {/* Modals */}
//             <ProfileListModal
//                 visible={modalConfig.visible}
//                 title={modalConfig.title}
//                 data={modalConfig.data}
//                 onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
//                 currentUserId={userStatus?.userId || null}
//             />

//             <Modal
//                 visible={isRespondModalVisible}
//                 transparent
//                 animationType="fade"
//                 onRequestClose={() => setIsRespondModalVisible(false)}
//             >
//                 <TouchableWithoutFeedback onPress={() => setIsRespondModalVisible(false)}>
//                     <View style={styles.modalOverlay}>
//                         <TouchableWithoutFeedback>
//                             <View style={styles.responseCard}>
//                                 <Text style={styles.responseTitle}>Respond to {user?.name}</Text>

//                                 <TouchableOpacity
//                                     style={[styles.responseBtn, styles.acceptBtn]}
//                                     onPress={() => handleAction('accept')}
//                                 >
//                                     <Text style={styles.btnText}>Accept Friend Request</Text>
//                                 </TouchableOpacity>

//                                 <TouchableOpacity
//                                     style={[styles.responseBtn, styles.declineBtn]}
//                                     onPress={() => handleAction('decline')}
//                                 >
//                                     <Text style={styles.btnText}>Decline</Text>
//                                 </TouchableOpacity>

//                                 <TouchableOpacity
//                                     style={[styles.responseBtn, styles.blockBtn]}
//                                     onPress={() => handleAction('block')}
//                                 >
//                                     <Text style={[styles.btnText, { color: '#FF453A' }]}>Block User</Text>
//                                 </TouchableOpacity>

//                                 <TouchableOpacity
//                                     style={styles.cancelBtn}
//                                     onPress={() => setIsRespondModalVisible(false)}
//                                 >
//                                     <Text style={styles.cancelText}>Cancel</Text>
//                                 </TouchableOpacity>
//                             </View>
//                         </TouchableWithoutFeedback>
//                     </View>
//                 </TouchableWithoutFeedback>
//             </Modal>

//         </ScrollView>
//     );
// }

// const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: Theme.dark.background },
//     content: { padding: 20, paddingBottom: 40 },
//     center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.dark.background },
//     lockedContainer: { marginTop: 10 },
//     scrollContent: {
//         paddingHorizontal: 20, // This is your "Safe Zone"
//         paddingTop: 20,
//         paddingBottom: 40,
//         gap: 15, // This automatically adds even vertical spacing between every component!
//     },
//     modalOverlay: {
//         flex: 1,
//         backgroundColor: 'rgba(0,0,0,0.8)',
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     responseCard: {
//         width: '85%',
//         backgroundColor: Theme.container.background,
//         borderRadius: 24,
//         padding: 24,
//         borderWidth: 1,
//         borderColor: Theme.container.mainBorder,
//         alignItems: 'center',
//     },
//     responseTitle: {
//         color: 'white',
//         fontSize: 18,
//         fontWeight: '700',
//         marginBottom: 20,
//         textAlign: 'center',
//     },
//     responseBtn: {
//         width: '100%',
//         paddingVertical: 14,
//         borderRadius: 12,
//         alignItems: 'center',
//         marginBottom: 10,
//     },
//     acceptBtn: { backgroundColor: Theme.dark.primary },
//     declineBtn: { backgroundColor: Theme.container.mainBorder },
//     blockBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF453A' },
//     btnText: { color: 'white', fontWeight: '700', fontSize: 15 },
//     cancelBtn: { marginTop: 10 },
//     cancelText: { color: Theme.container.inactiveText, fontSize: 14, fontWeight: '600' },
// });