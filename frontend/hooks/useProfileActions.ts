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

// Pass triggerToast as an argument so the hook can use the screen's toast logic
export const useProfileActions = (triggerToast: (msg: string, icon?: string) => void) => {
    const [loading, setLoading] = useState(false);

    const handlePoke = (name: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Now triggerToast will work!
        triggerToast(`You poked ${name.split(' ')[0]}!`, 'hand-o-right');
    };

    const handleAdd = async (currentUserId: number, targetUserId: number) => {
        setLoading(true);
        try {
            await sendFriendRequest(currentUserId, targetUserId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            triggerToast("Friend Request Sent!", 'check');
        } catch (err) {
            Alert.alert("Error", "Could not send friend request.");
        } finally {
            setLoading(false);
        }
    };

    // Renamed to handleConfirmBlock to match your return statement
    const handleConfirmBlock = (currentUserId: number, targetUserId: number, name: string, onSuccess: () => void) => {
        Alert.alert("Block User", `Are you sure you want to block ${name}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Block",
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    try {
                        await blockFriend(currentUserId, targetUserId);
                        triggerToast("User blocked", "ban");
                        onSuccess();
                    } catch (err) {
                        Alert.alert("Error", "Could not block user.");
                    } finally {
                        setLoading(false);
                    }
                }
            }
        ]);
    };

    const handleUnblock = async (currentUserId: number, targetUserId: number, onSuccess: () => void) => {
        setLoading(true);
        try {
            // Using the removeFriend service to clear the 'Blocked' status
            await removeFriend(currentUserId, targetUserId);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            triggerToast("User unblocked", "unlock");

            onSuccess(); // Refresh the profile data
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not unblock user.");
        } finally {
            setLoading(false);
        }
    };

    const handlePendingDecision = async (currentUserId: number, targetUserId: number, action: 'accept' | 'decline', onSuccess: () => void) => {
        setLoading(true);
        try {
            if (action === 'accept') {
                await acceptFriendRequest(currentUserId, targetUserId);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                triggerToast('Request accepted!', 'check');
            } else {
                await declineFriendRequest(currentUserId, targetUserId);
                triggerToast('Request declined', 'times');
            }
            onSuccess();
        } catch (err) {
            Alert.alert("Error", "Action failed.");
        } finally {
            setLoading(false);
        }
    };

    return {
        handlePoke,
        handleAdd,
        handleConfirmBlock,
        handleUnblock,
        handlePendingDecision,
        loading
    };
};