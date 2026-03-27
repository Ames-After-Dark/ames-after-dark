import { Redirect, type Route } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { View, ActivityIndicator } from 'react-native';
import { Theme } from '@/constants/theme';

const LOGIN_ROUTE = '/(auth)/index' as Route;

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

    return <Redirect href={LOGIN_ROUTE} />;
}