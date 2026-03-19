import { useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';

import {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    blockFriend,
    removeFriend
} from '@/services/userService';

export const useProfileActions = (currentUserId: number, targetUserId: number) => {
    const [loading, setLoading] = useState(false);

    const handleAdd = async () => {
        setLoading(true);
        try {
            await sendFriendRequest(currentUserId, targetUserId);
            // Add your Haptics and Toast triggers here
        } finally {
            setLoading(false);
        }
    };

    const handleBlock = () => {
        Alert.alert("Block?", "Are you sure...", [
            { text: "Block", onPress: () => blockFriend(currentUserId, targetUserId) }
        ]);
    };

    return { handleAdd, handleBlock, loading };
};