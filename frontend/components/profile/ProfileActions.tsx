import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/theme';

type Status = 'SELF' | 'FRIEND' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'STRANGER' | 'BLOCKED';

interface ProfileActionsProps {
    status: Status;
    loading: boolean;
    userName: string;
    onAction: (action: string) => void;
}

export const ProfileActions = ({ status, loading, userName, onAction }: ProfileActionsProps) => {
    if (status === 'SELF') return null;

    const renderPrimaryButton = () => {
        if (loading) return <ActivityIndicator color="white" />;

        switch (status) {
            case 'FRIEND': return <Text style={styles.primaryText}>Poke {userName.split(' ')[0]}</Text>;
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

            {status === 'FRIEND' && (
                <View style={styles.secondaryRow}>
                    <TouchableOpacity onPress={() => onAction('remove')}>
                        <Text style={styles.dangerText}>Remove Friend</Text>
                    </TouchableOpacity>
                    <Text style={styles.divider}>•</Text>
                    <TouchableOpacity onPress={() => onAction('block')}>
                        <Text style={styles.dangerText}>Block</Text>
                    </TouchableOpacity>
                </View>
            )}

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
    dangerText: {
        color: Theme.container.inactiveText,
        fontSize: 13, fontWeight: '600'
    },
    divider: {
        color: Theme.container.inactiveText
    },
});