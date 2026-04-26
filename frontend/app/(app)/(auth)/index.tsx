import { ThemedText } from "@/components/themed-text"
import { useAuth } from "@/hooks/use-auth"
import { isAuth0UserCancelledError } from "@/utils/auth0Errors"
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

export default function LoginScreen() {
  const { signIn, isLoading, error, isAuthenticated, isSwitching } = useAuth()

  const showError = error && !isAuth0UserCancelledError(error)

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <View style={{ width: '100%' }}>
          <ThemedText type="title" style={styles.title}>Ames After Dark</ThemedText>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={signIn}
          disabled={isLoading}
        >
          <ThemedText style={styles.buttonText}>Sign In</ThemedText>
        </TouchableOpacity>

        {showError && (
          <ThemedText style={styles.errorText}>{error!.message}</ThemedText>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    backgroundColor: "#ff3399",
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
