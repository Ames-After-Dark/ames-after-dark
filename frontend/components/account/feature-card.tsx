import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '@/constants/theme';

interface FeatureCardProps {
    title: string;
    children: React.ReactNode;
    style?: ViewStyle;
}

export const FeatureCard = ({ title, children, style }: FeatureCardProps) => (
    <View style={[styles.card, style]}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.content}>
            {children}
        </View>
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: Theme.container.background,
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        minHeight: 130,
    },
    title: {
        color: Theme.dark.white,
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'lowercase',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
});