import React, { useState } from 'react';
import {
    Modal, View, Text, TextInput, FlatList, Image,
    TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, StyleSheet
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { PendingFriendRequest } from '@/services/userService';

interface PendingModalProps {
    visible: boolean;
    onClose: () => void;
    requests: PendingFriendRequest[];
    currentUserId: number;
    onAction: (request: PendingFriendRequest, action: 'accept' | 'decline') => Promise<void>;
    loadingId: number | null;
}

export const PendingRequestsModal = ({ visible, onClose, requests, currentUserId, onAction, loadingId }: PendingModalProps) => {
    const [search, setSearch] = useState('');

    const renderItem = ({ item }: { item: PendingFriendRequest }) => {
        const isIncoming = item.user_id_2 === currentUserId;
        const otherUser = isIncoming ? item.users_friendships_user_id_1Tousers : item.users_friendships_user_id_2Tousers;
        const isThisLoading = loadingId === Number(otherUser?.id);

        return (
            <View style={styles.requestRow}>
                <Image source={otherUser?.avatar || require('@/assets/images/Logo.png')} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{otherUser?.name}</Text>
                    <Text style={styles.status}>{isIncoming ? 'Incoming request' : 'Sent request'}</Text>
                </View>

                {isIncoming ? (
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => onAction(item, 'accept')}>
                            {isThisLoading ? <ActivityIndicator size="small" color="white" /> : <FontAwesome name="check" size={14} color="white" />}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineBtn} onPress={() => onAction(item, 'decline')}>
                            <FontAwesome name="times" size={14} color="#FF453A" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => onAction(item, 'decline')}>
                        <Text style={{ color: '#FF453A' }}>Cancel</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.content}>
                            <Text style={styles.title}>Pending Requests</Text>
                            <FlatList
                                data={requests}
                                renderItem={renderItem}
                                keyExtractor={(item, index) => index.toString()}
                                ListEmptyComponent={<Text style={styles.empty}>No pending requests</Text>}
                            />
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Text style={{ color: 'white' }}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    content: { width: '90%', backgroundColor: Theme.container.background, borderRadius: 20, padding: 20, maxHeight: '60%' },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    requestRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
    name: { color: 'white', fontWeight: '600' },
    status: { color: 'gray', fontSize: 11 },
    actions: { flexDirection: 'row', gap: 10 },
    acceptBtn: { backgroundColor: Theme.dark.secondary, padding: 8, borderRadius: 20, width: 35, alignItems: 'center' },
    declineBtn: { borderWidth: 1, borderColor: '#FF453A', padding: 8, borderRadius: 20, width: 35, alignItems: 'center' },
    cancelBtn: { padding: 5 },
    empty: { color: 'gray', textAlign: 'center', marginTop: 20 },
    closeBtn: { marginTop: 20, alignSelf: 'center', padding: 10 }
});