import { ThemedText } from "@/components/themed-text"
import { useAuth } from "@/hooks/use-auth"
import { completeUserRegistration } from "@/services/userService"
import { useRouter } from "expo-router"
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  InputAccessoryView,
} from "react-native"
import { useState } from "react"
import DateTimePicker from '@react-native-community/datetimepicker'

export default function RegisterScreen() {
  const router = useRouter()
  const { user, getAccessToken, refreshUserStatus } = useAuth()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [birthday, setBirthday] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inputAccessoryViewID = "phoneInputDone"

  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatPhoneNumber = (text: string): string => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '')

    // Format as (XXX) XXX-XXXX
    if (cleaned.length <= 3) {
      return cleaned
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text)
    setPhoneNumber(formatted)
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios') // Keep picker open on iOS
    if (selectedDate) {
      setBirthday(selectedDate)
    }
  }

  const handleSubmit = async () => {
    // Validate phone number
    const cleanedPhone = phoneNumber.replace(/\D/g, '')
    if (cleanedPhone.length !== 10) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number")
      return
    }

    // Check age (must be 21+)
    const today = new Date()
    const age = today.getFullYear() - birthday.getFullYear()
    const monthDiff = today.getMonth() - birthday.getMonth()
    const dayDiff = today.getDate() - birthday.getDate()

    const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age

    if (actualAge < 21) {
      Alert.alert("Age Restriction", "You must be at least 21 years old to use this app")
      return
    }

    setIsLoading(true)
    try {
      // Get access token from Auth0
      const accessToken = await getAccessToken()

      if (!accessToken) {
        throw new Error('No access token available')
      }

      await completeUserRegistration(accessToken, {
        phoneNumber: cleanedPhone,
        birthday: formatDate(birthday)
      })

      // Refresh user status in auth context
      await refreshUserStatus()

      // Navigate to home screen immediately
      router.replace('/(app)/(tabs)' as any)
    } catch (error: any) {
      console.error("Registration error:", error)
      const errorMessage = error.message || "Failed to complete registration"
      Alert.alert("Registration Failed", errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={{ width: '100%' }}>
            <ThemedText style={styles.title}>Complete Your Profile</ThemedText>
            <ThemedText style={styles.subtitle}>
              We need a few more details to get you started
            </ThemedText>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Phone Number</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="(555) 555-5555"
              placeholderTextColor="#666"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={14}
              editable={!isLoading}
              returnKeyType="done"
              inputAccessoryViewID={Platform.OS === 'ios' ? inputAccessoryViewID : undefined}
            />
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.label}>Birthday</ThemedText>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                Keyboard.dismiss()
                setShowDatePicker(true)
              }}
              disabled={isLoading}
            >
              <ThemedText style={styles.dateButtonText}>
                {formatDate(birthday)}
              </ThemedText>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={birthday}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}
          </View>

          <ThemedText style={styles.note}>
            You must be 21 or older to use this app
          </ThemedText>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Complete Registration</ThemedText>
            )}
          </TouchableOpacity>
        </View>
        {Platform.OS === 'ios' && (
          <InputAccessoryView nativeID={inputAccessoryViewID}>
            <View style={styles.accessoryView}>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={Keyboard.dismiss}
              >
                <ThemedText style={styles.doneButtonText}>Done</ThemedText>
              </TouchableOpacity>
            </View>
          </InputAccessoryView>
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#0a0a0a",
  },
  content: {
    width: "100%",
    maxWidth: 450,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
    color: "#fff",
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 32,
    textAlign: "center",
    color: "#ccc",
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#fff",
  },
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  dateButton: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#fff",
  },
  note: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 24,
    textAlign: "center",
    color: "#ccc",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  accessoryView: {
    backgroundColor: "#1a1a1a",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneButtonText: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
})