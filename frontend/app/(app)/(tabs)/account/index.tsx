import { Redirect, type Route } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { View, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/theme';

const LOGIN_ROUTE = '/(auth)/index' as Route;

export default function AccountIndex() {
    const { currentUser, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.dark.background }}>
                <ActivityIndicator size="large" color={Theme.dark.primary} />
            </View>
        );
    }

    if (currentUser?.id) {
        return <Redirect href={`/account/${currentUser.id}` as Route} />;
    }

    return <Redirect href={LOGIN_ROUTE} />;
}

// import React, { useState, useEffect, useRef } from 'react';
// import { 
//     View, 
//     ScrollView, 
//     StyleSheet, 
//     ActivityIndicator, 
//     RefreshControl, 
//     Animated,
// } from 'react-native';

// import { useFocusEffect } from '@react-navigation/native';
// import { useAuth } from "@/hooks/use-auth";
// import { useFriends } from '@/hooks/useFriends';
// import { Theme } from '@/constants/theme';
// import { PendingFriendRequest } from '@/types/types';

// // Services
// import { 
//     getUserProfileByAuth, 
//     getPendingFriendRequests, 
//     getRecommendedFriends,
//     sendFriendRequest,
//     acceptFriendRequest,
//     declineFriendRequest,
//     removeFriend
// } from '@/services/userService';

// // Modular Components
// import { ProfileHeader } from '@/components/profile/ProfileHeader';
// import { ProfileStats } from '@/components/profile/ProfileStats';
// import { ProfileGrid } from '@/components/profile/ProfileGrid';
// import { ProfileListModal } from '@/components/profile/ProfileListModal';

// export default function AccountScreen() {
//     const { userStatus, getAccessToken } = useAuth();

//     // --- Animation Refs (Use useRef for persistent values) ---
//     const toastTranslateY = useRef(new Animated.Value(-20)).current;
//     const toastOpacity = useRef(new Animated.Value(0)).current;

//     // --- UI State ---
//     const [showToast, setShowToast] = useState(false);
//     const [toastMessage, setToastMessage] = useState('');
//     const [toastIcon, setToastIcon] = useState('check');
//     const [loading, setLoading] = useState(true);
//     const [refreshing, setRefreshing] = useState(false);
//     const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

//     // --- Data State ---
//     const [user, setUser] = useState<any>(null);
//     const [pendingRequests, setPendingRequests] = useState<any[]>([]);
//     const [recommendedFriends, setRecommendedFriends] = useState<any[]>([]);
//     const [modalConfig, setModalConfig] = useState<{ visible: boolean; title: string; data: any[] }>({
//         visible: false,
//         title: '',
//         data: []
//     });

//     const { friends, refetch: refetchFriends } = useFriends(userStatus?.userId || 0);

//     // --- Toast Logic ---
//     const triggerToast = (message: string, icon: string = 'check') => {
//         setToastMessage(message);
//         setToastIcon(icon);
//         setShowToast(true);
//         toastTranslateY.setValue(-20);

//         Animated.parallel([
//             Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
//             Animated.spring(toastTranslateY, { toValue: 50, friction: 5, useNativeDriver: true }),
//         ]).start();

//         setTimeout(() => {
//             Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
//                 setShowToast(false);
//             });
//         }, 2500);
//     };

//     // --- Action Handlers ---
//     const handleAction = async (type: 'accept' | 'decline' | 'cancel' | 'add', friendId: number) => {
//         if (!userStatus?.userId) return;
//         setActionLoadingId(friendId);
        
//         try {
//             if (type === 'accept') {
//                 await acceptFriendRequest(userStatus.userId, friendId);
//                 triggerToast("Request Accepted!", "check");
//             } else if (type === 'decline' || type === 'cancel') {
//                 await removeFriend(userStatus.userId, friendId);
//                 triggerToast(type === 'cancel' ? "Request Cancelled" : "Request Declined", "times");
//             } else if (type === 'add') {
//                 await sendFriendRequest(userStatus.userId, friendId);
//                 setRecommendedFriends(prev => prev.filter(f => f.id !== friendId));
//                 triggerToast("Request Sent!", "paper-plane");
//             }
//             fetchData(); // Refresh lists
//             refetchFriends();
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setActionLoadingId(null);
//         }
//     };

//     // const fetchData = async () => {
//     //     if (!userStatus?.userId) return;
//     //     try {
//     //         const token = await getAccessToken();
//     //         if (!token) return;

//     //         const [userData, pendingData, recData] = await Promise.all([
//     //             getUserProfileByAuth(token),
//     //             getPendingFriendRequests(userStatus.userId),
//     //             getRecommendedFriends(userStatus.userId, 5)
//     //         ]);
            
//     //         setUser(userData);
//     //         setPendingRequests(pendingData || []);
//     //         setRecommendedFriends(recData || []);
//     //     } catch (err) {
//     //         console.error("Fetch Error:", err);
//     //     } finally {
//     //         setLoading(false);
//     //         setRefreshing(false);
//     //     }
//     // };

//     const fetchData = async () => {
//         // 1. Guard against null user
//         if (!userStatus?.userId) {
//             console.log("No user ID found, skipping fetch.");
//             return;
//         }

//         try {
//             const myId = userStatus.userId;
//             const token = await getAccessToken();
//             if (!token) return;

//             // 2. Fetch everything in parallel for speed
//             const [userData, rawRequests, recData] = await Promise.all([
//                 getUserProfileByAuth(token),
//                 getPendingFriendRequests(myId),
//                 getRecommendedFriends(myId, 5)
//             ]);

//             // 3. Map the raw database requests into UI-friendly objects
//             const mappedRequests = (rawRequests || []).map(req => {
//                 const isIUser1 = req.user_id_1 === myId;

//                 // Get the OTHER person's data
//                 const friendData = isIUser1
//                     ? req.users_friendships_user_id_2Tousers
//                     : req.users_friendships_user_id_1Tousers;

//                 return {
//                     ...friendData,
//                     id: friendData?.id,
//                     // If I am user_id_1, I am the sender (SENT). Otherwise, I RECEIVED it.
//                     type: isIUser1 ? 'SENT' : 'RECEIVED'
//                 };
//             });

//             // 4. Update all states
//             setUser(userData);
//             setRecommendedFriends(recData || []);
//             setPendingRequests(mappedRequests);

//         } catch (err) {
//             console.error("Fetch Error:", err);
//         } finally {
//             setLoading(false);
//             setRefreshing(false);
//         }
//     };

//     useEffect(() => { fetchData(); }, [userStatus?.userId]);

//     useFocusEffect(
//         React.useCallback(() => {
//             fetchData();
//             refetchFriends();
//         }, [])
//     );

//     if (loading) {
//         return (
//             <View style={styles.center}>
//                 <ActivityIndicator size="large" color={Theme.dark.secondary} />
//             </View>
//         );
//     }

//     return (
//         <View style={styles.container}>
//             <ScrollView
//                 contentContainerStyle={styles.scrollContent}
//                 refreshControl={
//                     <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); refetchFriends(); }} tintColor={Theme.dark.secondary} />
//                 }
//             >
//                 <ProfileHeader user={user} showBio={false} />
                
//                 <ProfileStats
//                     friendCount={friends.length}
//                     // Switch the data source based on isMe
//                     mutualCount={isMe ? pendingRequests.length : mutualFriends.length}
//                     isMe={isMe}
//                     onPressFriends={() => setModalConfig({ visible: true, title: 'Friends', data: friends })}
//                     // Switch the modal title based on isMe
//                     onPressMutuals={() => setModalConfig({
//                         visible: true,
//                         title: isMe ? 'Pending Requests' : 'Mutual Friends',
//                         data: isMe ? pendingRequests : mutualFriends
//                     })}
//                 />

//                 <ProfileHeader user={user} showBio={true} onlyBio={true} />
//                 <ProfileGrid user={user} />
//             </ScrollView>

//             <ProfileListModal 
//                 visible={modalConfig.visible}
//                 title={modalConfig.title}
//                 data={modalConfig.data}
//                 onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
//                 currentUserId={userStatus?.userId || null}
//                 recommendedData={recommendedFriends}
//                 actionLoadingId={actionLoadingId}
//                 onAddRecommended={(id) => handleAction('add', id)}
//                 onAcceptRequest={(id) => handleAction('accept', id)}
//                 onDeclineRequest={(id) => handleAction('decline', id)}
//                 onCancelRequest={(id) => handleAction('cancel', id)}
//             />
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     // container: { flex: 1, backgroundColor: Theme.dark.background },
//     // scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40, gap: 15 },
//     container: {
//         flex: 1,
//         backgroundColor: Theme.dark.background
//     },
//     scrollContent: {
//         paddingHorizontal: 20,
//         paddingTop: 0,   // Change this to 0 to remove the gap
//         paddingBottom: 40,
//         gap: 15
//     },
//     center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.dark.background },
// });

// // import React, { useState, useEffect } from 'react';
// // import { 
// //     View, 
// //     ScrollView, 
// //     StyleSheet, 
// //     ActivityIndicator, 
// //     RefreshControl, 
// //     TouchableOpacity,
// //     Alert,
// //     Animated,
// //  } from 'react-native';

// // import * as Haptics from 'expo-haptics';
// // import { useFocusEffect } from '@react-navigation/native';
// // import { FontAwesome } from '@expo/vector-icons';
// // import { router } from 'expo-router';

// // import { useAuth } from "@/hooks/use-auth";
// // import { useFriends } from '@/hooks/useFriends';
// // import { 
// //     getUserProfileByAuth, 
// //     getPendingFriendRequests, 
// //     sendFriendRequest, 
// //     getRecommendedFriends
// // } from '@/services/userService';

// // import {
// //     acceptFriendRequest,
// //     blockFriend,
// //     declineFriendRequest,
// //     getUserById,
// //     getUserFriends,
// //     getMutualFriends,
// //     removeFriend,
// //     // sendFriendRequest
// // } from '@/services/userService';

// // import { Theme } from '@/constants/theme';
// // import { PendingFriendRequest } from '@/types/types';

// // // Modular Components
// // import { ProfileHeader } from '@/components/profile/ProfileHeader';
// // import { ProfileStats } from '@/components/profile/ProfileStats';
// // import { ProfileGrid } from '@/components/profile/ProfileGrid';
// // import { ProfileListModal } from '@/components/profile/ProfileListModal';
// // // import TopHeader from '@/components/TopHeader'

// // export default function AccountScreen() {
// //     const { username, userStatus, getAccessToken } = useAuth();

// //     const scaleAnim = useState(new Animated.Value(1))[0];
// //     const [requestSent, setRequestSent] = useState(false);

// //     const [showToast, setShowToast] = useState(false);
// //     const [toastMessage, setToastMessage] = useState('');
// //     const [toastIcon, setToastIcon] = useState('check'); // Default icon name
// //     const toastTranslateY = useState(new Animated.Value(-20))[0];
// //     const toastOpacity = useState(new Animated.Value(0))[0];

// //     const [isFriend, setIsFriend] = useState(false);
// //     const [hasIncomingRequest, setHasIncomingRequest] = useState(false);
// //     const [isRespondModalVisible, setIsRespondModalVisible] = useState(false);
// //     const [isBlocked, setIsBlocked] = useState(false);
// //     const [friendActionLoading, setFriendActionLoading] = useState(false);

// //     // Data State
// //     const [user, setUser] = useState<any>(null);
// //     const [pendingRequests, setPendingRequests] = useState<PendingFriendRequest[]>([]);
// //     const [loading, setLoading] = useState(true);
// //     const [refreshing, setRefreshing] = useState(false);
// //     const [recommendedFriends, setRecommendedFriends] = useState<any[]>([]);

// //     const [modalConfig, setModalConfig] = useState<{ visible: boolean; title: string; data: any[] }>({
// //         visible: false,
// //         title: '',
// //         data: []
// //     });

// //     // Friends Hook (Using your existing logic)
// //     const { friends, refetch: refetchFriends } = useFriends(userStatus?.userId || 0);

// //     const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

// //     const handleAddRecommendedFriend = async (friendId: number) => {
// //         if (!userStatus?.userId) return;

// //         setActionLoadingId(friendId);
// //         try {
// //             await sendFriendRequest(userStatus.userId, friendId);
// //             // Success! Remove them from the local recommended list so they disappear
// //             setRecommendedFriends(prev => prev.filter(f => f.id !== friendId));
// //             // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
// //         } catch (err) {
// //             console.error('Failed to send friend request:', err);
// //             // Alert.alert("Error", "Could not send friend request.");
// //         } finally {
// //             setActionLoadingId(null);
// //         }
// //     };

// //     const fetchData = async () => {
// //     if (!userStatus?.userId) return;
// //     try {
// //         const token = await getAccessToken();
// //         if (!token) return;

// //         // Fetch everything in parallel
// //         const [userData, pendingData, recData] = await Promise.all([
// //             getUserProfileByAuth(token),
// //             getPendingFriendRequests(userStatus.userId),
// //             getRecommendedFriends(userStatus.userId, 5) // <--- Add this call
// //         ]);
        
// //         setUser(userData);
// //         setPendingRequests(pendingData || []);
// //         setRecommendedFriends(recData || []); // <--- Update the state here
// //     } catch (err) {
// //         console.error("Failed to fetch account data:", err);
// //     } finally {
// //         setLoading(false);
// //         setRefreshing(false);
// //     }
// // };

// //     const triggerToast = (message: string, icon: string = 'check') => {

// //         setToastMessage(message);
// //         setToastIcon(icon);
// //         setShowToast(true);

// //         // Reset position just in case
// //         toastTranslateY.setValue(-20);

// //         // Animate In
// //         Animated.parallel([
// //             Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
// //             Animated.spring(toastTranslateY, { toValue: 50, friction: 5, useNativeDriver: true }),
// //         ]).start();

// //         // Animate Out after delay
// //         setTimeout(() => {
// //             Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
// //                 setShowToast(false);
// //             });
// //         }, 2500);
// //     };

// //     const handleAddFriend = async () => {
// //         try {
// //             const friendId = Number(id);
// //             if (!friendId || Number.isNaN(friendId)) {
// //                 Alert.alert("Error", "Invalid friend ID.");
// //                 return;
// //             }

// //             if (!userStatus?.userId) {
// //                 Alert.alert("Error", "You must be logged in to add friends.");
// //                 return;
// //             }

// //             if (friendId === userStatus.userId) {
// //                 Alert.alert("Error", "You can't add yourself as a friend.");
// //                 return;
// //             }

// //             await sendFriendRequest(userStatus.userId, friendId);

// //             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// //             Animated.sequence([
// //                 Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
// //                 Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
// //             ]).start();

// //             setRequestSent(true);

// //             // Use the toast instead of Alert
// //             triggerToast("Friend Request Sent!", 'check');

// //         } catch (err) {
// //             console.error("Failed to add friend:", err);
// //             // Keep Alert for errors only
// //             Alert.alert("Error", "Could not send friend request.");
// //         }
// //     };

// //     const handleRemoveFriend = async () => {
// //         const friendId = Number(id);
// //         if (!friendId || Number.isNaN(friendId)) {
// //             Alert.alert("Error", "Invalid friend ID.");
// //             return;
// //         }

// //         if (!userStatus?.userId) {
// //             Alert.alert("Error", "You must be logged in.");
// //             return;
// //         }

// //         Alert.alert(
// //             "Remove friend",
// //             `Remove ${user?.name || 'this user'} from your friends list?`,
// //             [
// //                 { text: "Cancel", style: "cancel" },
// //                 {
// //                     text: "Remove",
// //                     style: "destructive",
// //                     onPress: async () => {
// //                         try {
// //                             setFriendActionLoading(true);
// //                             await removeFriend(userStatus.userId!, friendId);
// //                             setIsFriend(false);
// //                             triggerToast("Friend removed", "user-times");
// //                         } catch (err) {
// //                             console.error("Failed to remove friend:", err);
// //                             Alert.alert("Error", "Could not remove friend.");
// //                         } finally {
// //                             setFriendActionLoading(false);
// //                         }
// //                     }
// //                 }
// //             ]
// //         );
// //     };

// //     const handleBlockFriend = async () => {
// //         const friendId = Number(id);
// //         if (!friendId || Number.isNaN(friendId)) {
// //             Alert.alert("Error", "Invalid friend ID.");
// //             return;
// //         }

// //         if (!userStatus?.userId) {
// //             Alert.alert("Error", "You must be logged in.");
// //             return;
// //         }

// //         Alert.alert(
// //             "Block user",
// //             `Block ${user?.name || 'this user'}?`,
// //             [
// //                 { text: "Cancel", style: "cancel" },
// //                 {
// //                     text: "Block",
// //                     style: "destructive",
// //                     onPress: async () => {
// //                         try {
// //                             setFriendActionLoading(true);
// //                             await blockFriend(userStatus.userId!, friendId);
// //                             setIsFriend(false);
// //                             setIsBlocked(true);
// //                             setRequestSent(false);
// //                             triggerToast("User blocked", "ban");
// //                         } catch (err) {
// //                             console.error("Failed to block user:", err);
// //                             Alert.alert("Error", "Could not block user.");
// //                         } finally {
// //                             setFriendActionLoading(false);
// //                         }
// //                     }
// //                 }
// //             ]
// //         );
// //     };

// //     const handleUnblockUser = async () => {
// //         const friendId = Number(id);
// //         if (!friendId || Number.isNaN(friendId)) {
// //             Alert.alert("Error", "Invalid user ID.");
// //             return;
// //         }

// //         if (!userStatus?.userId) {
// //             Alert.alert("Error", "You must be logged in.");
// //             return;
// //         }

// //         Alert.alert(
// //             "Unblock user",
// //             `Unblock ${user?.name || 'this user'}?`,
// //             [
// //                 { text: "Cancel", style: "cancel" },
// //                 {
// //                     text: "Unblock",
// //                     onPress: async () => {
// //                         try {
// //                             setFriendActionLoading(true);
// //                             await removeFriend(userStatus.userId!, friendId);
// //                             setIsBlocked(false);
// //                             setRequestSent(false);
// //                             triggerToast("User unblocked", "unlock");
// //                         } catch (err) {
// //                             console.error("Failed to unblock user:", err);
// //                             Alert.alert("Error", "Could not unblock user.");
// //                         } finally {
// //                             setFriendActionLoading(false);
// //                         }
// //                     }
// //                 }
// //             ]
// //         );
// //     };

// //     const handlePendingDecision = async (friendId: number, action: 'accept' | 'decline' | 'block') => {
// //         if (!userStatus?.userId) {
// //             Alert.alert("Error", "You must be logged in.");
// //             return;
// //         }

// //         try {
// //             setFriendActionLoading(true);

// //             if (action === 'accept') {
// //                 await acceptFriendRequest(userStatus.userId, friendId);
// //                 setIsFriend(true);
// //                 triggerToast('Request accepted', 'check');
// //             } else if (action === 'decline') {
// //                 await declineFriendRequest(userStatus.userId, friendId);
// //                 triggerToast('Request declined', 'times');
// //             } else {
// //                 await blockFriend(userStatus.userId, friendId);
// //                 setIsBlocked(true);
// //                 triggerToast('User blocked', 'ban');
// //             }

// //             setHasIncomingRequest(false);
// //             setRequestSent(false);
// //         } catch (err) {
// //             console.error(`Failed to ${action} friend request:`, err);
// //             Alert.alert('Error', `Could not ${action} request.`);
// //         } finally {
// //             setFriendActionLoading(false);
// //         }
// //     };


// //     // Initial Load
// //     useEffect(() => { fetchData(); }, [userStatus?.userId]);

// //     // Refresh when screen comes into focus
// //     useFocusEffect(
// //         React.useCallback(() => {
// //             fetchData();
// //             refetchFriends();
// //         }, [])
// //     );

// //     const onRefresh = () => {
// //         setRefreshing(true);
// //         fetchData();
// //         refetchFriends();
// //     };

// //     if (loading) {
// //         return (
// //             <View style={styles.center}>
// //                 <ActivityIndicator size="large" color={Theme.dark.secondary} />
// //             </View>
// //         );
// //     }

// //     return (
// //         <View style={styles.container}>

// //             <ScrollView
// //                 contentContainerStyle={styles.scrollContent}
// //                 refreshControl={
// //                     <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.dark.secondary} />
// //                 }
// //             >
// //                 {/* 1. Header (Avatar, Name, Bio) */}
// //                 <ProfileHeader user={user} showBio={false} />

// //                 {/* 2. Stats (Friends & Pending) */}
// //                 <ProfileStats
// //                     friendCount={friends.length}
// //                     mutualCount={pendingRequests.length}
// //                     secondLabel="pending"
// //                     onPressFriends={() => setModalConfig({ visible: true, title: 'Friends', data: friends })}
// //                     onPressMutuals={() => setModalConfig({ visible: true, title: 'Pending Requests', data: pendingRequests })}
// //                 />

// //                 <ProfileHeader user={user} showBio={true} onlyBio={true} />

// //                 {/* 3. Grid (Drinks, Streaks, Fav Bar) */}
// //                 <ProfileGrid user={user} />

// //                 {/* Note: ProfileActions is omitted here because status is 'SELF' */}
// //             </ScrollView>

// //             <ProfileListModal 
// //                 visible={modalConfig.visible}
// //                 title={modalConfig.title}
// //                 data={modalConfig.data}
// //                 onClose={() => setModalConfig(prev => ({ ...prev, visible: false }))}
// //                 currentUserId={userStatus?.userId || null}
// //                 recommendedData={recommendedFriends}
// //                 actionLoadingId={actionLoadingId}
// //                 onAddRecommended={(id) => handleAddRecommendedFriend(id)}
// //                 onAcceptRequest={(id) => handleAction('accept', id)} // You'll need a generic handleAction or specific ones
// //                 onDeclineRequest={(id) => handleAction('decline', id)}
// //                 onCancelRequest={(id) => handleAction('cancel', id)}
// //             />

// //         </View>
// //     );
// // }

// // const styles = StyleSheet.create({
// //     scrollContent: {
// //         paddingHorizontal: 20, // This is your "Safe Zone"
// //         paddingBottom: 40,
// //         gap: 15, // This automatically adds even vertical spacing between every component!
// //     },
// //     container: { 
// //         flex: 1, 
// //         backgroundColor: Theme.dark.background 
// //     },
// //     content: { 
// //         paddingHorizontal: 20,
// //         paddingBottom: 80 
// //     },
// //     center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.dark.background },
// // });