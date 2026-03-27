import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { Skeleton } from '@/components/ui/skeleton';

export const MapSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Map Area */}
            <View style={styles.mapContainer}>
                <Skeleton width="100%" height="100%" borderRadius={8} />
            </View>

            {/* Bottom Sheet Area */}
            <View style={styles.skeletonSheet}>
                <View style={styles.dragHandle} />

                <View style={styles.sheetHeader}>
                    {/* Profile Circle */}
                    <Skeleton width={60} height={60} borderRadius={30} />

                    <View style={{ gap: 8 }}>
                        {/* Title & Subtitle Lines */}
                        <Skeleton width={150} height={15} />
                        <Skeleton width={100} height={15} />
                    </View>
                </View>

                {/* Optional: Add a few extra lines to fill the sheet */}
                <View style={{ marginTop: 25, gap: 10 }}>
                    <Skeleton width="90%" height={12} />
                    <Skeleton width="80%" height={12} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.dark.background
    },
    mapContainer: {
        flex: 1,
        marginTop: 16,
        marginHorizontal: 16
    },
    skeletonSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 250,
        backgroundColor: '#1A1A1A', // Theme.container.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20
    },
    dragHandle: {
        width: 40,
        height: 5,
        backgroundColor: Theme.container.inactiveBorder,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 15
    },
    sheetHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
});