import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'expo-router'
import Logo from '@/components/logo'

export default function CollectUserInfo() {
    const { dataCollectionParams, completeDataCollection } = useAuth()
    const router = useRouter()
    const [birthday, setBirthday] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        // Basic validation
        if (!birthday || !phoneNumber) {
            Alert.alert('Error', 'Please fill in all fields')
            return
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(birthday)) {
            Alert.alert('Error', 'Please enter birthday in YYYY-MM-DD format')
            return
        }

        setIsSubmitting(true)

        try {
            await completeDataCollection(birthday, phoneNumber)
            Alert.alert('Success', 'Profile completed successfully!')
            // Navigate to your main app screen
            router.replace('/(app)/(tabs)') // Adjust path as needed
        } catch (error) {
            Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <View style={styles.container}>

            <View style={styles.image}>
                <Logo />
            </ View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Birthday</Text>
                <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={birthday}
                    onChangeText={setBirthday}
                    editable={!isSubmitting}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                    style={styles.input}
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    editable={!isSubmitting}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Complete Signup</Text>
                )}
            </TouchableOpacity>
        </View >
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    image: {
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
    },
    email: {
        fontSize: 14,
        color: '#888',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#999',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
})