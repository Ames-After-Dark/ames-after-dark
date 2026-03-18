import React, { useState, useMemo } from 'react';
import {
    Modal, View, Text, TextInput, FlatList, Image,
    TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Alert, StyleSheet
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { Friend } from '@/types/types';
import { router } from 'expo-router';

interface FriendsModalProps {
    visible: boolean;
    onClose: () => void;
    friends: Friend[];
    recommended: Friend[];
    onRemoveFriend: (id: number) => Promise<void>;
    onAddRecommended: (id: number) => Promise<void>;
    actionLoadingId: number | null;
}

export const FriendsModal = ({
    visible, onClose, friends, recommended, onRemoveFriend, onAddRecommended, actionLoadingId
}: FriendsModalProps) => {
    const [search, setSearch] = useState('');

    const filteredFriends = useMemo(() => {
        return friends.filter(f =>
            f.name?.toLowerCase().includes(search.toLowerCase()) ||
            f.username?.toLowerCase().includes(search.toLowerCase())
        );
    }, [friends, search]);

    const handleRemovePress = (friend: Friend) => {
        Alert.alert(
            'Remove Friend',
            `Are you sure you want to remove ${friend.name || friend.username}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => onRemoveFriend(Number(friend.id)) }
            ]
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Friends</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Text style={styles.closeButton}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.modalSearchContainer}>
                                <FontAwesome name="search" size={18} color={Theme.search.inactiveInput} />
                                <TextInput
                                    style={styles.modalSearchBar}
                                    placeholder="Search friends!"
                                    placeholderTextColor={Theme.search.inactiveInput}
                                    value={search}
                                    onChangeText={setSearch}
                                />
                            </View>

                            <FlatList
                                data={filteredFriends}
                                keyExtractor={(item) => item.id.toString()}
                                ListHeaderComponent={
                                    !search && recommended.length > 0 ? (
                                        <View>
                                            <Text style={styles.sectionTitle}>Recommended</Text>
                                            {recommended.map(rec => (
                                                <RecommendedRow
                                                    key={rec.id}
                                                    item={rec}
                                                    onAdd={() => onAddRecommended(Number(rec.id))}
                                                    loading={actionLoadingId === Number(rec.id)}
                                                />
                                            ))}
                                            <View style={styles.divider} />
                                            <Text style={styles.sectionTitle}>Friends</Text>
                                        </View>
                                    ) : null
                                }
                                renderItem={({ item }) => (
                                    <View style={styles.friendRow}>
                                        <TouchableOpacity
                                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
                                            onPress={() => { onClose(); router.push(`/account/${item.id}`); }}
                                        >
                                            <Image source={item.avatar || require('@/assets/images/Logo.png')} style={styles.avatar} />
                                            <View>
                                                <Text style={styles.friendName}>{item.name}</Text>
                                                <Text style={styles.friendUser}>@{item.username}</Text>
                                            </View>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleRemovePress(item)}>
                                            {actionLoadingId === Number(item.id) ?
                                                <ActivityIndicator size="small" /> :
                                                <FontAwesome name="user-times" size={16} color="#FF453A" />
                                            }
                                        </TouchableOpacity>
                                    </View>
                                )}
                            />
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// Helper internal component for recommended rows
const RecommendedRow = ({ item, onAdd, loading }: any) => (
    <View style={styles.friendRow}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Image source={item.avatar || require('@/assets/images/Logo.png')} style={styles.avatar} />
            <View>
                <Text style={styles.friendName}>{item.name}</Text>
                <Text style={styles.friendUser}>@{item.username}</Text>
            </View>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onAdd} disabled={loading}>
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addButtonText}>Add</Text>}
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '90%', maxHeight: '70%', backgroundColor: Theme.container.background, borderRadius: 24, paddingVertical: 16 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
    modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },
    closeButton: { color: 'gray', fontSize: 24 },
    modalSearchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.search.background, marginHorizontal: 20, paddingHorizontal: 12, borderRadius: 10, height: 45, marginBottom: 12 },
    modalSearchBar: { flex: 1, marginLeft: 10, color: 'white' },
    friendRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderColor: Theme.container.mainBorder },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    friendName: { color: 'white', fontWeight: '600' },
    friendUser: { color: 'gray', fontSize: 12 },
    sectionTitle: { color: 'white', paddingHorizontal: 20, paddingVertical: 10, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: Theme.container.mainBorder, marginVertical: 8 },
    addButton: { backgroundColor: Theme.dark.secondary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 15 },
    addButtonText: { color: 'white', fontWeight: 'bold' }
});