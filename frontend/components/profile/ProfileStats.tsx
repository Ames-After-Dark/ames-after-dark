import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { FontAwesome } from '@expo/vector-icons';

interface ProfileStatsProps {
    friendCount?: number;
    isMe?: boolean;
    mutualCount?: number;
    isFriend?: boolean;
    onPressFriends?: () => void;
    onPressMutuals?: () => void;
    secondLabel?: string;
}

export const ProfileStats = ({
    friendCount,
    mutualCount,
    onPressFriends,
    onPressMutuals,
    isMe,
    isFriend,
    ...props
}: ProfileStatsProps) => {

    const canSeeFriends = isMe || isFriend;
    const canSeeMutuals = isMe || isFriend;

    return (
        <View style={styles.statsRow}>
            {/* Friends - Left Side */}
            <TouchableOpacity
                style={styles.statButton}
                onPress={onPressFriends}
                disabled={!canSeeFriends} // Disable clicking if not friends
            >
                <Text style={styles.statNumber}>
                    {friendCount ?? 0}
                </Text>
                <Text style={styles.statLabel}>friends</Text>
            </TouchableOpacity>

            {/* Pending/Mutual - Right Side */}
            <TouchableOpacity
                style={styles.statButton}
                onPress={onPressMutuals}
                disabled={!canSeeMutuals}
            >
                <Text style={styles.statNumber}>
                    {canSeeMutuals ? (mutualCount ?? 0) : <FontAwesome name="lock" size={18} color={Theme.container.inactiveText} />}
                </Text>
                <Text style={styles.statLabel}>
                    {isMe ? 'pending' : 'mutual'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: 8,
        gap: 8
    },
    statButton: {
        flex: 1,
        backgroundColor: Theme.container.background,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statNumber: {
        color: Theme.dark.white,
        fontSize: 20,
        fontWeight: '700'
    },
    statLabel: {
        color: Theme.container.inactiveText,
        fontSize: 12,
        marginTop: 2
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: Theme.container.background,
        borderRadius: 20,
        paddingVertical: 15,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    divider: {
        width: 1,
        height: '60%',
        backgroundColor: Theme.container.mainBorder,
        opacity: 0.5,
    },
});