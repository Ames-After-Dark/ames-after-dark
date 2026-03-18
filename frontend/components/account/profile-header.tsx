import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';

interface ProfileHeaderProps {
    user: any;
    isOwnProfile: boolean;
}

export const ProfileHeader = ({ user, isOwnProfile }: ProfileHeaderProps) => {
    return (
        <View style={styles.headerRow}>
            <Image
                source={user?.avatar || require('@/assets/images/Logo.png')}
                style={styles.profileImage}
            />
            <View style={{ flex: 1 }}>
                <Text style={styles.profileName}>{user?.name || 'Loading!'}</Text>
                <Text style={styles.profileUserName}>@{user?.username || 'Loading'}</Text>
            </View>

            {isOwnProfile && (
                <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/account/settings')}>
                    <FontAwesome name="gear" size={24} color={Theme.container.inactiveText} />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 4,
    },
    profileImage: {
        width: 70,
        height: 70,
        borderRadius: 12,
        marginRight: 12,
    },
    profileName: {
        color: Theme.dark.white,
        fontSize: 20,
        fontWeight: '700',
    },
    profileUserName: {
        color: Theme.container.inactiveText,
        fontSize: 14,
    },
});