import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import {Button, Text, View, ActivityIndicator} from 'react-native';
import {useAuth0, Auth0Provider} from 'react-native-auth0';

export default function RootLayoutNav(){
    const {authorize, clearSession, user, getCredentials, error, isLoading} = useAuth0();
    const segments = useSegments();
    const router = useRouter();
//     let content;

    //Maybe should be using stack here
//     if (user){
//         content = <Tabs/>;
//     }
//     else {
//         content = <Login/>;
//     }
       useEffect (() => {
           if (user){
               router.replace('/(tabs)');
           }
           else{
               router.replace('/(auth)');
           }
        }, [user]);
//     useEffect(() => {
//         if (isLoading) {
//             return;
//         }
//
//         const inAuthGroup = segments[0] === '(auth)';
//         const inTabsGroup = segments[0] === '(tabs)';
//
//         if (user && !inTabsGroup) {
//             // User is logged in but not in tabs, redirect to tabs
//             router.replace('/(tabs)');
//         } else if (!user && !inAuthGroup){
//             // User is not logged in and not in auth, redirect to login
//             router.replace('/(auth)');
//         }
//     }, [authorize, user, isLoading]);
//
//     return content;
//     if (isLoading) {
//         return (
//             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//                 <ActivityIndicator size="large" />
//             </View>
//         );
//     }
};

