import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/theme';
import FontAwesome from '@expo/vector-icons/build/FontAwesome';

type Status = 'SELF' | 'FRIEND' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'STRANGER' | 'BLOCKED';

interface ProfileActionsProps {
    status: Status;
    loading: boolean;
    userName?: string | null;
    onAction: (action: string) => void;
}

export const ProfileActions = ({ status, loading, userName, onAction }: ProfileActionsProps) => {
    if (status === 'SELF') return null;

    const renderPrimaryButton = () => {
        if (loading) return <ActivityIndicator color="white" />;

        const firstName = (userName ?? '').trim().split(' ')[0] || 'Friend';

        switch (status) {
            case 'FRIEND': return <Text style={styles.primaryText}>Poke {firstName}</Text>;
            case 'STRANGER': return <Text style={styles.primaryText}>Add Friend</Text>;
            case 'PENDING_SENT': return <Text style={styles.primaryText}>Request Sent</Text>;
            case 'PENDING_RECEIVED': return <Text style={styles.primaryText}>Respond to Request</Text>;
            case 'BLOCKED': return <Text style={styles.primaryText}>Unblock User</Text>;
            default: return null;
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.primaryButton,
                    status === 'PENDING_SENT' && { backgroundColor: Theme.container.inactiveText },
                    status === 'FRIEND' && styles.pokeButton
                ]}
                onPress={() => {
                    if (status === 'FRIEND') onAction('poke');
                    else if (status === 'PENDING_RECEIVED') onAction('respond');
                    else onAction('primary');
                }}
                disabled={loading || status === 'PENDING_SENT'}
            >
                {renderPrimaryButton()}
            </TouchableOpacity>

            <View style={styles.safetyFooter}>
                {status === 'FRIEND' && (
                    <>
                        <TouchableOpacity
                            onPress={() => onAction('remove')}
                            style={styles.footerItem}
                        >
                            <FontAwesome name="user-times" size={12} color={Theme.container.inactiveText} style={styles.footerIcon} />
                            <Text style={styles.dangerText}>Remove Account</Text>
                        </TouchableOpacity>

                        <View style={styles.footerDivider} />
                    </>
                )}

                <TouchableOpacity
                    onPress={() => onAction('block')}
                    style={styles.footerItem}
                >
                    <FontAwesome name="shield" size={12} color={Theme.container.inactiveText} style={styles.footerIcon} />
                    <Text style={styles.dangerText}>Block Account</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 10,
        width: '100%',
        alignItems: 'center'
    },
    primaryButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: Theme.dark.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pokeButton: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Theme.dark.primary
    },
    primaryText: {
        color: Theme.dark.white,
        fontSize: 16,
        fontWeight: '800'
    },
    secondaryRow: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 20,
        opacity: 0.7
    },
    safetyFooter: {
        marginTop: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: 12,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    footerIcon: {
        marginRight: 6,
        opacity: 0.8,
    },
    footerDivider: {
        width: 1,
        height: 14,
        backgroundColor: Theme.container.mainBorder,
        marginHorizontal: 4,
    },
    dangerText: {
        color: Theme.container.inactiveText,
        fontSize: 13,
        fontWeight: '600',
    },
    divider: {
        color: Theme.container.inactiveText
    }
});