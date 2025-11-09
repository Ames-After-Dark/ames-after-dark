import React from 'react';
import { Stack } from 'expo-router';

export default function AccountStackLayout() {
    return (
        <Stack>
            <Stack.Screen
                name="account"
                options={{ headerShown: false }} // Hides header on your profile
            />

            <Stack.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    headerBackTitle: 'Profile',
                    headerStyle: {
                        backgroundColor: '#0b0b12',
                    },
                    headerTintColor: 'white',
                }}
            />

            <Stack.Screen
                name="[id]"
                options={{
                    headerStyle: {
                        backgroundColor: '#0b0b12',
                    },
                    headerTintColor: 'white',
                    headerBackTitle: 'Back',
                    title: '',
                }}
            />
        </Stack>
    );
}