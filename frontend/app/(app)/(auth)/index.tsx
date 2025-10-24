import { ThemedText } from "@/components/themed-text"
import { useAuth } from "@/hooks/use-auth"
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { useRouter } from 'expo-router'

export default function LoginScreen() {
    const { signIn, isLoading, error, isAuthenticated, isSwitching} = useAuth()

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={{ width: '100%' }}>
            <ThemedText style={styles.title}>Ames After Dark</ThemedText>
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={signIn}
            disabled={isLoading}
          >
              <ThemedText style={styles.buttonText}>Sign In</ThemedText>
          </TouchableOpacity>

          {error && (
            <ThemedText style={styles.errorText}>{error.message}</ThemedText>
          )}
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
    backgroundColor: "#0a0a0a", // dark background (can tweak for your theme)
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
    marginBottom: 30,
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
  button: {
    backgroundColor: "#2563eb", // nice blue
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#f87171",
    marginTop: 16,
    textAlign: "center",
  },
})
