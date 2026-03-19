import React, { useState, useRef, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Image,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Animated,
    PanResponder,
    Dimensions
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { router } from 'expo-router';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// --- TYPES ---
interface UserData {
    id: number;
    name: string;
    username: string;
    avatar?: string;
}

interface FriendshipItem {
    user_id_1?: number;
    user_id_2?: number;
    users_friendships_user_id_1Tousers?: UserData;
    users_friendships_user_id_2Tousers?: UserData;
    id?: number;
    name?: string;
    username?: string;
    avatar?: string;
}

interface ProfileListModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    data: FriendshipItem[];
    currentUserId: number | null;
    recommendedData?: UserData[];
    onAddRecommended?: (id: number) => void;
    actionLoadingId?: number | null;
    emptyMessage?: string;
}

export const ProfileListModal = ({
    visible,
    onClose,
    title,
    data,
    currentUserId,
    recommendedData = [],
    onAddRecommended,
    actionLoadingId,
    emptyMessage
}: ProfileListModalProps) => {
    const [search, setSearch] = useState('');
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // Animation Logic
    useEffect(() => {
        if (visible) {
            Animated.spring(panY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 10
            }).start();
        } else {
            Animated.timing(panY, {
                toValue: SCREEN_HEIGHT,
                duration: 300,
                useNativeDriver: true
            }).start();
        }
    }, [visible, panY]);

    // Gesture Logic
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) panY.setValue(gestureState.dy);
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 150 || gestureState.vy > 0.5) {
                    closeModal();
                } else {
                    Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
                }
            }
        })
    ).current;

    const closeModal = () => {
        Animated.timing(panY, {
            toValue: SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true
        }).start(() => {
            setSearch(''); // Clear search on close
            onClose();
        });
    };

    const getDisplayUser = (item: FriendshipItem): UserData | undefined => {
        const user1 = item?.users_friendships_user_id_1Tousers;
        const user2 = item?.users_friendships_user_id_2Tousers;

        if (user1 && user1.id !== currentUserId) return user1;
        if (user2 && user2.id !== currentUserId) return user2;

        // Fallback for flat lists
        if (item.id) return item as UserData;
        return undefined;
    };

    const filteredData = data.filter((item) => {
        const user = getDisplayUser(item);
        const searchStr = search.toLowerCase();
        return (
            (user?.name || '').toLowerCase().includes(searchStr) ||
            (user?.username || '').toLowerCase().includes(searchStr)
        );
    });

    const renderHeader = () => {
        if (title !== 'Friends' || search.length > 0 || recommendedData.length === 0) return null;

        return (
            <View style={styles.recommendedSection}>
                <Text style={styles.sectionTitle}>Recommended Friends</Text>
                {recommendedData.map((rec) => (
                    <View key={rec.id} style={styles.itemRow}>
                        <TouchableOpacity
                            style={styles.userInfo}
                            onPress={() => { closeModal(); router.push(`/account/${rec.id}`); }}
                        >
                            <Image
                                source={rec.avatar ? { uri: rec.avatar } : require('@/assets/images/Logo.png')}
                                style={styles.avatar}
                            />
                            <View>
                                <Text style={styles.name}>{rec.name}</Text>
                                <Text style={styles.username}>@{rec.username}</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.addButton, actionLoadingId === rec.id && styles.disabledButton]}
                            onPress={() => onAddRecommended?.(rec.id)}
                            disabled={actionLoadingId === rec.id}
                        >
                            {actionLoadingId === rec.id ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.addButtonText}>Add</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                ))}
                <View style={styles.divider} />
                <Text style={styles.sectionTitle}>Your Friends</Text>
            </View>
        );
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="none">
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View style={StyleSheet.absoluteFill} />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[styles.sheet, { transform: [{ translateY: panY }] }]}
                >
                    <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                        <View style={styles.handle} />
                    </View>

                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{title}</Text>
                        <TouchableOpacity onPress={closeModal}>
                            <FontAwesome name="times-circle" size={26} color={Theme.container.inactiveText} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchContainer}>
                        <FontAwesome name="search" size={16} color={Theme.search.inactiveInput} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search..."
                            placeholderTextColor={Theme.search.inactiveInput}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>

                    <FlatList
                        data={filteredData}
                        keyExtractor={(item, index) => `${getDisplayUser(item)?.id || index}-${index}`}
                        ListHeaderComponent={renderHeader}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            const displayUser = getDisplayUser(item);
                            if (!displayUser) return null;

                            return (
                                <TouchableOpacity
                                    style={styles.itemRow}
                                    onPress={() => {
                                        closeModal();
                                        router.push(displayUser.id === currentUserId ? '/account' : `/account/${displayUser.id}`);
                                    }}
                                >
                                    <View style={styles.userInfo}>
                                        <Image
                                            source={displayUser.avatar ? { uri: displayUser.avatar } : require('@/assets/images/Logo.png')}
                                            style={styles.avatar}
                                        />
                                        <View>
                                            <Text style={styles.name}>{displayUser.name}</Text>
                                            <Text style={styles.username}>@{displayUser.username}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        }}
                        ListEmptyComponent={<Text style={styles.emptyText}>{emptyMessage || `No users found`}</Text>}
                    />
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    sheet: {
        height: SCREEN_HEIGHT * 0.85,
        backgroundColor: Theme.container.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    dragHandleContainer: { width: '100%', paddingVertical: 15, alignItems: 'center' },
    handle: { width: 40, height: 5, backgroundColor: Theme.container.mainBorder, borderRadius: 10 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    title: { color: Theme.dark.white, fontSize: 22, fontWeight: '800' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Theme.search.background,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 48,
        borderWidth: 1,
        borderColor: Theme.search.border,
        marginBottom: 10,
    },
    searchInput: { flex: 1, marginLeft: 10, color: 'white', fontSize: 16 },
    itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
    userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15, borderWidth: 1, borderColor: Theme.container.mainBorder },
    name: { color: Theme.dark.white, fontSize: 16, fontWeight: '600' },
    username: { color: Theme.container.inactiveText, fontSize: 13 },
    recommendedSection: { marginTop: 10 },
    sectionTitle: { color: Theme.dark.white, fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 15, marginTop: 10 },
    addButton: { backgroundColor: Theme.dark.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
    addButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
    disabledButton: { opacity: 0.5 },
    divider: { height: 1, backgroundColor: Theme.container.mainBorder, marginVertical: 15 },
    emptyText: { color: Theme.container.inactiveText, textAlign: 'center', marginTop: 60, fontSize: 16 },
});