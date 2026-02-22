import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    FlatList,
    Modal,
    TextInput,
    TouchableWithoutFeedback,
    Animated,
    Alert
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { Friend } from '@/types/types';
import { getUserById, getUserFriends, getMutualFriends } from '@/services/userService';
import { Theme } from '@/constants/theme';

export default function FriendProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [user, setUser] = useState<any | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Modal State
    const [isModalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [friendsToShow, setFriendsToShow] = useState<Friend[]>([]);
    const [mutualFriends, setMutualFriends] = useState<Friend[]>([]);
    const [modalSearchQuery, setModalSearchQuery] = useState('');

    // Animations
    const scaleAnim = useState(new Animated.Value(1))[0];
    const [showToast, setShowToast] = useState(false);
    const toastOpacity = useState(new Animated.Value(0))[0];
    const toastTranslateY = useState(new Animated.Value(-20))[0];

    const [isFriend, setIsFriend] = useState(false);
    const [requestSent, setRequestSent] = useState(false);

    // TODO - update hardcoded auth ID
    const CURRENT_USER_ID = 2; 

    const [toastMessage, setToastMessage] = useState('');
    const [toastIcon, setToastIcon] = useState('check'); // Default icon name

    const triggerToast = (message: string, icon: string = 'check') => {
        setToastMessage(message);
        setToastIcon(icon);
        setShowToast(true);

        // Reset position just in case
        toastTranslateY.setValue(-20);

        // Animate In
        Animated.parallel([
            Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(toastTranslateY, { toValue: 50, friction: 5, useNativeDriver: true }),
        ]).start();

        // Animate Out after delay
        setTimeout(() => {
            Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
                setShowToast(false);
            });
        }, 2500);
    };

    const handlePoke = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]).start();

        // Trigger the dynamic toast
        triggerToast(`You poked ${user?.name?.split(' ')[0]}!`, 'hand-o-right');
    };

    const handleAddFriend = async () => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Animated.sequence([
                Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
            ]).start();

            // Simulate API
            // await sendFriendRequest(CURRENT_USER_ID, id); 

            setRequestSent(true);

            // Use the toast instead of Alert
            triggerToast("Friend Request Sent!", 'check');

        } catch (err) {
            console.error("Failed to add friend:", err);
            // Keep Alert for errors only
            Alert.alert("Error", "Could not send friend request.");
        }
    };

    useEffect(() => {
        if (id) {
            const fetchUserData = async () => {
                setLoading(true);
                try {
                    // Check if already friends locally first
                    const myFriends = await getUserFriends(CURRENT_USER_ID);
                    const isAlreadyFriend = myFriends.some(f => f.id.toString() === id);
                    setIsFriend(isAlreadyFriend);

                    // Fetch profile data
                    const [userData, friendsData, mutualData] = await Promise.all([
                        getUserById(id),
                        getUserFriends(id),
                        getMutualFriends(CURRENT_USER_ID, id)
                    ]);

                    setUser(userData);
                    setFriends(friendsData || []);
                    setMutualFriends(mutualData || []);
                } catch (err) {
                    setError(err instanceof Error ? err : new Error('Failed to fetch user data'));
                } finally {
                    setLoading(false);
                }
            };
            fetchUserData();
        }
    }, [id]);

    if (loading) return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={Theme.dark.secondary || 'white'} />
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Custom Toast Notification */}
            {showToast && (
                <Animated.View style={[
                    styles.toastContainer,
                    { opacity: toastOpacity, transform: [{ translateY: toastTranslateY }] }
                ]}>
                    {/* Dynamic Icon */}
                    <FontAwesome name={toastIcon as any} size={16} color={Theme.dark.white} />

                    {/* Dynamic Message */}
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>
            )}

            <ScrollView contentContainerStyle={styles.content}>

                {/* --- SHARED HEADER (Used for both Friend & Stranger) --- */}
                {/* 1. HEADER ROW (Just Profile Pic & Name now) */}
                <View style={styles.headerRow}>
                    <Image
                        source={user?.avatar || require('../../../../assets/images/Logo.png')}
                        style={styles.profileImage}
                    />
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.name}</Text>
                        <Text style={styles.usernameText}>@{user?.username}</Text>
                    </View>
                </View>

                {/* 2. NEW STATS ROW (Moved here, below header) */}
                <View style={styles.statsRow}>
                    <TouchableOpacity
                        style={styles.statButton}
                        onPress={() => {
                            setModalTitle("Mutual Friends");
                            setFriendsToShow(mutualFriends);
                            setModalVisible(true);
                        }}
                    >
                        <Text style={styles.statNumber}>{mutualFriends.length}</Text>
                        <Text style={styles.statLabelSmall}>mutual</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.statButton}
                        onPress={() => {
                            setModalTitle("Total Friends");
                            setFriendsToShow(friends);
                            setModalVisible(true);
                        }}
                    >
                        <Text style={styles.statNumber}>{friends.length}</Text>
                        <Text style={styles.statLabelSmall}>total</Text>
                    </TouchableOpacity>
                </View>

                {/* --- CONDITIONAL BODY CONTENT --- */}
                {isFriend ? (
                    /* FRIEND VIEW */
                    <View>
                        {/* Bio Section */}
                        <View style={styles.bioContainer}>
                            <Text style={styles.bioText}>
                                {user?.bio || "This user hasn't added a bio yet. They're a mystery! 🕵️‍♂️"}
                            </Text>
                        </View>

                        {/* Middle Grid (Drink / Streak) */}
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

                        {/* Favorite Bar Card */}
                        <View style={styles.largeCard}>
                            <Text style={styles.featureTitle}>fav. bar w/ official photo</Text>
                            <View style={styles.largePlaceholder}>
                                <FontAwesome name="map-marker" size={40} color={Theme.dark.muted} />
                            </View>
                        </View>

                        {/* Poke Button */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handlePoke}
                            style={{ marginTop: 10 }}
                        >
                            <Animated.View style={[
                                styles.pokeButton,
                                { transform: [{ scale: scaleAnim }] }
                            ]}>
                                <Text style={styles.pokeText}>
                                    poke {user?.name?.split(' ')[0] || '??'}
                                </Text>
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* STRANGER VIEW */
                    <View style={styles.verticalListContainer}>
                        {/* Locked Content */}
                        <View style={styles.wideFeatureCard}>
                            <View>
                                <Text style={styles.featureTitle}>fav drink</Text>
                                <Text style={styles.lockSubtext}>Add friend to view details!</Text>
                            </View>
                            <FontAwesome name="lock" size={20} color={Theme.container.inactiveText} />
                        </View>

                        <View style={styles.wideFeatureCard}>
                            <View>
                                <Text style={styles.featureTitle}>fav bar</Text>
                                <Text style={styles.lockSubtext}>Add friend to view details!</Text>
                            </View>
                            <FontAwesome name="lock" size={20} color={Theme.container.inactiveText} />
                        </View>

                        {/* Add Friend Button */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                handleAddFriend();
                                console.log("attempt to add friend with ID:", id);
                            }}
                            disabled={requestSent}
                        // style={{ marginTop: 0 }}
                        >
                            <Animated.View style={[
                                styles.addFriendButton,
                                {
                                    transform: [{ scale: scaleAnim }],
                                    backgroundColor: requestSent ? Theme.container.inactiveText : Theme.dark.primary
                                }
                            ]}>
                                <Text style={styles.addFriendText}>
                                    {requestSent ? "Request Sent" : "Add Friend"}
                                </Text>
                            </Animated.View>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {/* --- MODAL (Kept outside ScrollView) --- */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={() => setModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={styles.floatingModalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>{modalTitle}</Text>
                                <TouchableOpacity onPress={() => setModalVisible(false)}>
                                    <FontAwesome
                                        name="times-circle"
                                        size={26}
                                        color={Theme.container.inactiveText}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalSearchContainer}>
                                <FontAwesome name="search" size={16} color={Theme.search.inactiveInput} />
                                <TextInput
                                    style={styles.modalSearchBar}
                                    placeholder="Search..."
                                    placeholderTextColor={Theme.search.inactiveInput}
                                    value={modalSearchQuery}
                                    onChangeText={setModalSearchQuery}
                                />
                            </View>

                            <FlatList
                                data={friendsToShow.filter(f =>
                                    (f.name ?? '').toLowerCase().includes(modalSearchQuery.toLowerCase())
                                )}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.modalFriendRow}
                                        onPress={() => {
                                            setModalVisible(false);
                                            router.push(`/account/${item.id}`);
                                        }}
                                    >
                                        <Image
                                            source={item.avatar || require('../../../../assets/images/Logo.png')}
                                            style={styles.modalAvatar}
                                        />
                                        <View>
                                            <Text style={styles.modalFriendName}>{item.name}</Text>
                                            <Text style={styles.modalFriendUsername}>@{item.username}</Text>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                ListEmptyComponent={<Text style={styles.emptyText}>No matches found</Text>}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
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
        textTransform: 'uppercase',
        marginTop: 2,
    },
});