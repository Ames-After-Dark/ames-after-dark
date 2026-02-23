// TEMP_AUTH_START - Remove when re-enabling Auth0
import { ThemedText } from "@/components/themed-text"
import { useRouter } from "expo-router"
import { signupUser } from "@/services/userService"
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native"
import { useState } from "react"


export default function SignupScreen() {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSignup = async () => {
      if (!username.trim()) {
        Alert.alert("Error", "Please enter a username")
        return
      }

      setIsLoading(true)
      try {
        await signupUser(username.trim())
        Alert.alert("Success", "Account created! You can now login.", [
          { text: "OK", onPress: () => router.back() }
        ])
      } catch (error: any) {
        console.error("Signup error:", error)
        const errorMessage = error.message?.includes("409") || error.message?.includes("already exists")
          ? "Username already exists"
          : "Failed to create account"
        Alert.alert("Signup Failed", errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={{ width: '100%' }}>
            <ThemedText style={styles.title}>Sign Up</ThemedText>
            <ThemedText style={styles.subtitle}>Create a new account</ThemedText>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!isLoading}
          />

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Sign Up</ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.back()}
              disabled={isLoading}
            >
              <ThemedText style={styles.linkText}>Back</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
    )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
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
  input: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  button: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    color: "#60a5fa",
    fontSize: 14,
  },
})
// TEMP_AUTH_END
