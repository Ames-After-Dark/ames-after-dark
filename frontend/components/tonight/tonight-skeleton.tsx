import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';
import { Skeleton } from "@/components/ui/skeleton";

export const TonightSkeleton = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Hero Carousel Skeleton */}
        <View style={{ paddingHorizontal: 16, marginTop: 10, marginBottom: 20 }}>
            <Skeleton width="100%" height={200} borderRadius={16} style={{ backgroundColor: '#2C2C2C' }} />
        </View>

        {/* Sticky Tabs Skeleton */}
        <View style={styles.tabsRow}>
            <Skeleton width="30%" height={38} borderRadius={12} />
            <Skeleton width="30%" height={38} borderRadius={12} />
            <Skeleton width="30%" height={38} borderRadius={12} />
        </View>

        {/* Search Box Skeleton */}
        <View style={{ paddingHorizontal: 16, marginVertical: 10 }}>
            <Skeleton width="100%" height={45} borderRadius={12} />
        </View>

        {/* Content List Skeleton */}
        <View style={{ paddingHorizontal: 16, marginTop: 10, gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#1A1A1A', borderRadius: 14 }}>
                    <Skeleton width={60} height={60} borderRadius={10} />
                    <View style={{ flex: 1, gap: 8 }}>
                        <Skeleton width="60%" height={16} />
                        <Skeleton width="40%" height={12} />
                        <Skeleton width="80%" height={12} />
                    </View>
                </View>
            ))}
        </View>
    </ScrollView>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Theme.dark.background
    },
    tabsRow: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
});