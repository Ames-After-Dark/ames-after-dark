import React, { useState, useRef, useEffect, useMemo } from 'react';
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
    type?: 'SENT' | 'RECEIVED'; // Added this
    isHeader?: boolean;         // Added this for sectioning
    title?: string;             // Added this for sectioning
}

interface ProfileListModalProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    data: any[]; // Use any here because it's a mix of headers and users now
    currentUserId: number | null;
    recommendedData?: UserData[];
    onAddRecommended?: (id: number) => void;
    actionLoadingId?: number | null;
    onAcceptRequest?: (id: number) => void;
    onDeclineRequest?: (id: number) => void;
    onCancelRequest?: (id: number) => void;
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
    onCancelRequest,
    onAcceptRequest,
    onDeclineRequest,
}: ProfileListModalProps) => {
    const [search, setSearch] = useState('');
    const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    // 1. Logic to split and group the data
    const sections = useMemo(() => {
        const searchStr = search.toLowerCase();

        // Filter based on search first
        const filtered = data.filter(item => {
            const name = (item.name || '').toLowerCase();
            const username = (item.username || '').toLowerCase();
            return name.includes(searchStr) || username.includes(searchStr);
        });

        if (title !== 'Pending Requests') return filtered;

        const received = filtered.filter(item => item.type === 'RECEIVED');
        const sent = filtered.filter(item => item.type === 'SENT');

        return [
            ...(received.length > 0 ? [{ isHeader: true, title: 'Requests for You' }, ...received] : []),
            ...(sent.length > 0 ? [{ isHeader: true, title: 'Sent by You' }, ...sent] : [])
        ];
    }, [data, title, search]);

    // Animation & Gesture Logic (Kept your existing code)
    useEffect(() => {
        if (visible) {
            Animated.spring(panY, { toValue: 0, useNativeDriver: true, tension: 50, friction: 10 }).start();
        } else {
            Animated.timing(panY, { toValue: SCREEN_HEIGHT, duration: 300, useNativeDriver: true }).start();
        }
    }, [visible, panY]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => { if (gestureState.dy > 0) panY.setValue(gestureState.dy); },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 150 || gestureState.vy > 0.5) closeModal();
                else Animated.spring(panY, { toValue: 0, useNativeDriver: true }).start();
            }
        })
    ).current;

    const closeModal = () => {
        Animated.timing(panY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }).start(() => {
            setSearch('');
            onClose();
        });
    };

    // 2. Fixed renderHeader (Removed the broken 'item.isHeader' check)
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

    // 3. New renderItem that handles Headers vs. Users
    const renderItem = ({ item }: { item: UserData }) => {
        if (item.isHeader) {
            return (
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>{item.title}</Text>
                </View>
            );
        }

        const isOutgoing = item.type === 'SENT';

        return (
            <View style={styles.itemRow}>
                <TouchableOpacity
                    style={styles.userInfo}
                    onPress={() => {
                        closeModal();
                        router.push(`/account/${item.id}`);
                    }}
                >
                    <Image
                        source={item.avatar ? { uri: item.avatar } : require('@/assets/images/Logo.png')}
                        style={styles.avatar}
                    />
                    <View>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.username}>@{item.username}</Text>
                    </View>
                </TouchableOpacity>

                {title === 'Pending Requests' && (
                    <View style={styles.actionGroup}>
                        {isOutgoing ? (
                            <TouchableOpacity
                                style={styles.cancelBtnSmall}
                                onPress={() => onCancelRequest?.(item.id)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        ) : (
                            <>
                                <TouchableOpacity
                                    style={styles.acceptCircle}
                                    onPress={() => onAcceptRequest?.(item.id)}
                                >
                                    <FontAwesome name="check" size={14} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.declineCircle}
                                    onPress={() => onDeclineRequest?.(item.id)}
                                >
                                    <FontAwesome name="times" size={14} color="#FF453A" />
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                )}
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

                <Animated.View style={[styles.sheet, { transform: [{ translateY: panY }] }]}>
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
                        data={sections}
                        keyExtractor={(item, index) => item.isHeader ? `header-${index}` : item.id.toString()}
                        ListHeaderComponent={renderHeader}
                        renderItem={renderItem}
                        // Added sticky headers for better UX
                        stickyHeaderIndices={title === 'Pending Requests' ? sections.map((item, index) => item.isHeader ? index : -1).filter(i => i !== -1) : []}
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
    actionGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    acceptCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Theme.dark.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1,
        borderColor: '#FF453A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtnSmall: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: Theme.container.mainBorder,
    },
    cancelBtnText: {
        color: Theme.container.inactiveText,
        fontSize: 12,
        fontWeight: '700',
    },
    pendingStatus: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    sectionHeader: {
        backgroundColor: Theme.container.background,
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: Theme.container.mainBorder,
        marginTop: 10,
    },
    sectionHeaderText: {
        color: Theme.container.inactiveText,
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
});