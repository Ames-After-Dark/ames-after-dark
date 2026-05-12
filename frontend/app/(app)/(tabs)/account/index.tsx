import { Redirect, type Route } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { View, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/theme';
import { GuestSignInPrompt } from '@/components/auth/GuestSignInPrompt';

export default function AccountIndex() {
    const { currentUser, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Theme.dark.background }}>
                <ActivityIndicator size="large" color={Theme.dark.primary} />
            </View>
        );
    }

    if (currentUser?.id) {
        return <Redirect href={`/account/${currentUser.id}` as Route} />;
    }

    return (
        <GuestSignInPrompt
            title="Sign in for your account"
            message="Profiles, friends, favorites, settings, and location sharing are available after you sign in."
            icon="person-circle-outline"
        />
    );
}
