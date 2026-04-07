import { useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from './use-auth';

import {
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    blockFriend,
    removeFriend
} from '@/services/userService';

export const useProfileActions = (triggerToast: (msg: string, icon?: string) => void) => {
    const [loading, setLoading] = useState(false);
    const { getAccessToken } = useAuth();

    const handlePoke = (name: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        triggerToast(`You poked ${name.split(' ')[0]}!`, 'hand-o-right');

        console.log("Poke triggered for:", name);
    };

    const handleAdd = async (
        targetUserId: number,
        onOptimisticUpdate: () => void,
        onSuccess: () => void
    ) => {

        onOptimisticUpdate();

        try {
            const token = await getAccessToken();
            if (!token) throw new Error("No token available");
            await sendFriendRequest(token, targetUserId);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            triggerToast("Friend Request Sent!", 'check');

            onSuccess();

        } catch (err) {

            console.error(err);
            Alert.alert("Error", "Could not send friend request.");

            onSuccess();
        }
    };

    const handleConfirmBlock = (targetUserId: number, name: string, onSuccess: () => void) => {
        Alert.alert("Block User", `Are you sure you want to block ${name}?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Block",
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    try {
                        const token = await getAccessToken();
                        if (!token) throw new Error("No token available");
                        await blockFriend(token, targetUserId);
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

    const handleUnblock = async (targetUserId: number, onSuccess: () => void) => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            if (!token) throw new Error("No token available");
            await removeFriend(token, targetUserId);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            triggerToast("User unblocked", "unlock");

            onSuccess();
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not unblock user.");
        } finally {
            setLoading(false);
        }
    };

    const handlePendingDecision = async (targetUserId: number, action: 'accept' | 'decline', onSuccess: () => void) => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            if (!token) throw new Error("No token available");

            if (action === 'accept') {
                await acceptFriendRequest(token, targetUserId);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                triggerToast('Request accepted!', 'check');
            } else {
                await declineFriendRequest(token, targetUserId);
                triggerToast('Request declined', 'times');
            }
            onSuccess();
        } catch (err) {
            Alert.alert("Error", "Action failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (targetUserId: number, name: string, onSuccess: () => void) => {

        Alert.alert(
            "Remove Friend",
            `Are you sure you want to remove ${name} from your friends list?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const token = await getAccessToken();
                            if (!token) throw new Error("No token available");
                            await removeFriend(token, targetUserId);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            triggerToast(`${name} removed`, "user-times");
                            onSuccess();
                        } catch (err) {
                            Alert.alert("Error", "Could not remove friend.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleCancelRequest = async (targetUserId: number, name: string, onSuccess: () => void) => {
        setLoading(true);
        try {
            const token = await getAccessToken();
            if (!token) throw new Error("No token available");
            await removeFriend(token, targetUserId);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            triggerToast(`Cancelled request to ${name}`, 'times');
            onSuccess();
        } catch (err) {
            Alert.alert("Error", "Could not cancel request.");
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
        handleRemove,
        handleCancelRequest,
        loading
    };
};