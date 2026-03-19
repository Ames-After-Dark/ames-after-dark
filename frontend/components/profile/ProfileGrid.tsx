import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';

export const ProfileGrid = ({ user }: { user: any }) => {
    return (
        <View style={styles.container}>
            <View style={styles.gridRow}>
                <View style={styles.featureCard}>
                    <Text style={styles.featureTitle}>fav. drink</Text>
                    <View style={styles.placeholderPhoto}>
                        <FontAwesome name="glass" size={24} color={Theme.dark.secondary} />
                    </View>
                </View>

                <View style={styles.featureCard}>
                    <Text style={styles.featureTitle}>streak</Text>
                    <View style={styles.streakContent}>
                        <Text style={styles.streakNumber}>🔥 {user?.streak || 0}</Text>
                        <Text style={styles.statLabel}>weekends out</Text>
                    </View>
                </View>
            </View>

            <View style={styles.largeCard}>
                <Text style={styles.featureTitle}>fav. bar</Text>
                <View style={styles.largePlaceholder}>
                    <FontAwesome name="map-marker" size={40} color={Theme.dark.muted} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    gridRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 15 },
    featureCard: {
        flex: 1,
        backgroundColor: Theme.container.background,
        borderRadius: 12,
        padding: 15,
        minHeight: 130,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    featureTitle: { color: Theme.dark.white, fontSize: 14, fontWeight: '600', marginBottom: 10 },
    placeholderPhoto: {
        flex: 1,
        backgroundColor: Theme.search.background,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    streakContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    streakNumber: { color: Theme.dark.tertiary, fontSize: 32, fontWeight: 'bold' },
    statLabel: { color: Theme.container.inactiveText, fontSize: 12, textAlign: 'center' },
    largeCard: {
        backgroundColor: Theme.container.background,
        borderRadius: 12,
        padding: 15,
        height: 140,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
    },
    largePlaceholder: {
        flex: 1,
        backgroundColor: Theme.search.background,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});