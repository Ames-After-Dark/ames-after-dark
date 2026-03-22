import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

interface ProfileStatsProps {
    friendCount: number;
    isMe: boolean;
    mutualCount?: number;
    onPressFriends: () => void;
    onPressMutuals?: () => void;
    secondLabel?: string;
}

export const ProfileStats = ({ friendCount, mutualCount, onPressFriends, onPressMutuals, isMe, ...props }: ProfileStatsProps) => {

    return (
        <View style={styles.statsRow}>
            {/* Friends - Left Side */}
            <TouchableOpacity style={styles.statButton} onPress={onPressFriends}>
                <Text style={styles.statNumber}>{friendCount}</Text>
                <Text style={styles.statLabel}>friends</Text>
            </TouchableOpacity>

            {/* Vertical Line - Middle */}
            {/* <View style={styles.divider} /> */}

            {/* Pending/Mutual - Right Side */}
            <TouchableOpacity style={styles.statButton} onPress={onPressMutuals}>
                <Text style={styles.statNumber}>{mutualCount}</Text>
                <Text style={styles.statLabel}>
                    {isMe ? 'pending' : 'mutual'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    // return (
    //     <View style={styles.statsContainer}>
    //         {/* Friends Stat - Always visible */}
    //         <TouchableOpacity style={styles.statBox} onPress={onPressFriends}>
    //             <Text style={styles.statNumber}>{friendCount}</Text>
    //             <Text style={styles.statLabel}>friends</Text>
    //         </TouchableOpacity>

    //         <View style={styles.divider} />

    //         {/* Adaptive Secondary Stat */}
    //         <TouchableOpacity style={styles.statBox} onPress={onPressMutuals}>
    //             <Text style={styles.statNumber}>{mutualCount}</Text>
    //             <Text style={styles.statLabel}>
    //                 {isMe ? 'pending' : 'mutual'}
    //             </Text>
    //         </TouchableOpacity>
    //     </View>
    // );
};

const styles = StyleSheet.create({
    statsRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    statButton: {
        width: '48%',
        backgroundColor: Theme.container.background,
        borderRadius: 16,
        paddingVertical: 15,
        // marginBottom: 15,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
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
        backgroundColor: Theme.container.background, // A slightly lighter dark grey
        borderRadius: 20,
        paddingVertical: 15,
        marginVertical: 10,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        // Optional: subtle shadow for depth
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
    // statNumber: {
    //     fontSize: 20,
    //     fontWeight: '800',
    //     color: Theme.dark.white,
    //     marginBottom: 2,
    // },
    // statLabel: {
    //     fontSize: 12,
    //     fontWeight: '600',
    //     color: Theme.container.inactiveText, // Greyish text
    //     textTransform: 'uppercase',
    //     letterSpacing: 1,
    // },
    divider: {
        width: 1,
        height: '60%',
        backgroundColor: Theme.container.mainBorder,
        opacity: 0.5,
    },
});