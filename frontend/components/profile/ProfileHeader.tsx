import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Theme } from '@/constants/theme';

interface ProfileHeaderProps {
    user: any;
    isMe?: boolean;
    showBio?: boolean;
    onlyBio?: boolean;
}

export const ProfileHeader = ({ user, isMe, showBio, onlyBio }: ProfileHeaderProps): React.JSX.Element => {

    if (onlyBio) {

        if (!showBio) return <View />;

        return (
            <View style={styles.sidePadding}>
                <View style={styles.bioContainer}>
                    <Text style={styles.bioText}>
                        {user?.bio
                            ? user.bio
                            : `${user?.name || 'This user'} hasn't added a bio yet. They're a mystery! 🕵️‍♂️`}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Image
                    // source={user?.avatar || require('@/assets/images/Logo.png')}
                    source={
                        user?.avatar
                            ? (typeof user.avatar === 'string'
                                ? { uri: user.avatar }
                                : user.avatar)
                            : require('@/assets/images/Logo.png')
                    }

                    style={styles.profileImage}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.profileName}>{user?.name || 'Loading...'}</Text>
                    <Text style={styles.usernameText}>@{user?.username || 'username'}</Text>
                </View>
            </View>

            {showBio && (
                <View style={styles.bioContainer}>
                    <Text style={styles.bioText}>
                        {user?.bio || "No bio yet. Add one to tell others about yourself!"}
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 4,
        marginBottom: 10
    },
    sidePadding: {
        paddingHorizontal: 0,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    profileImage: {
        width: 75,
        height: 75,
        borderRadius: 15,
        marginRight: 15
    },
    infoContainer: {
        flex: 1
    },
    profileName: {
        color: Theme.dark.white,
        fontSize: 22,
        fontWeight: '700'
    },
    usernameText: {
        color: Theme.container.inactiveText,
        fontSize: 14
    },
    bioContainer: {
        backgroundColor: Theme.container.background,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Theme.container.mainBorder,
        marginTop: 4,
    },
    bioText: {
        color: Theme.container.titleText,
        fontSize: 14,
        fontStyle: 'italic',
        lineHeight: 20
    },
});