import React from 'react';
import {Alert, Button, StyleSheet, Text, View} from 'react-native';
import {useAuth0, Auth0Provider} from 'react-native-auth0';

export default function LoginAuth0(){
    const {authorize, clearSession, user, getCredentials, error, isLoading} = useAuth0();

    const onLogin = async () => {
        await authorize({}, {});
        const credentials = await getCredentials();
        Alert.alert('AccessToken: ' + credentials?.accessToken);
    };

    if (isLoading) {
        return (
          <View style={styles.container}>
            <Text>Loading...</Text>
          </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}> Auth0 - Login </Text>
            {user && <Text>You are logged in as {user.name}</Text>}
            {!user && <Text>You are not logged in</Text>}
            <Button style = {styles.button}
                onPress={onLogin}
                title='Log In'
            />
            {error && <Text style={styles.error}>{error.message}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5FCFF',
    },
    header: {
        fontSize: 20,
        textAlign: 'center',
        margin: 10,
    },
    error: {
        margin: 20,
        textAlign: 'center',
        color: '#D8000C'
    },
    button: {
        margin: 20,
    }
});

