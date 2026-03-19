import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

interface ProfileStatsProps {
    friendCount: number;
    mutualCount?: number;
    onPressFriends: () => void;
    onPressMutuals?: () => void;
    secondLabel?: string;
}

export const ProfileStats = ({ friendCount, mutualCount, onPressFriends, onPressMutuals, secondLabel }: ProfileStatsProps) => {
    return (
        <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statButton} onPress={onPressFriends}>
                <Text style={styles.statNumber}>{friendCount}</Text>
                <Text style={styles.statLabel}>friends</Text>
            </TouchableOpacity>

            {mutualCount !== undefined && (
                <TouchableOpacity style={styles.statButton} onPress={onPressMutuals}>
                    <Text style={styles.statNumber}>{mutualCount}</Text>
                    <Text style={styles.statLabel}>{secondLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
    statButton: {
        flex: 1,
        backgroundColor: Theme.container.background,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        alignItems: 'center',
    },
    statNumber: { color: Theme.dark.white, fontSize: 20, fontWeight: '700' },
    statLabel: { color: Theme.container.inactiveText, fontSize: 12, marginTop: 2 },
});