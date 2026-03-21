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

        // 2. This MUST match the argument name above
        triggerToast(`You poked ${name.split(' ')[0]}!`, 'hand-o-right');

        console.log("Poke triggered for:", name); // Add this to debug in your terminal
    };

    // hooks/useProfileActions.ts

    const handleAdd = async (
        currentUserId: number,
        targetUserId: number,
        onOptimisticUpdate: () => void, // 1. Function to change UI instantly
        onSuccess: () => void           // 2. Function to refresh data from server
    ) => {
        // START: Optimistic Update
        // We call this immediately BEFORE the await so the button 
        // changes the moment the user taps it.
        onOptimisticUpdate();

        try {
            await sendFriendRequest(currentUserId, targetUserId);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            triggerToast("Friend Request Sent!", 'check');

            // Final sync with the database
            onSuccess();
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not send friend request.");

            // If it fails, we refresh to "revert" the UI to the 'Add Friend' state
            onSuccess();
        }
    };

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

    const handleRemove = async (currentUserId: number, targetUserId: number, name: string, onSuccess: () => void) => {
        // We use an Alert first to prevent accidental unfriending
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
                            await removeFriend(currentUserId, targetUserId);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            triggerToast(`${name} removed`, "user-times");
                            onSuccess(); // Refresh the profile
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

    return {
        handlePoke,
        handleAdd,
        handleConfirmBlock,
        handleUnblock,
        handlePendingDecision,
        handleRemove,
        loading
    };
};