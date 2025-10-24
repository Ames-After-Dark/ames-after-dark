import { createContext, useContext, useEffect, useState } from "react"
import { useAuth0 } from "react-native-auth0"
import { useRouter, useSegments, useRootNavigationState } from "expo-router"

// Define the shape of our auth context
type AuthContextType = {
    signIn: () => Promise<void>
    signOut: () => Promise<void>
    isAuthenticated: boolean
    isLoading: boolean
    isSwitching: boolean,
    setIsSwitching: (value: boolean) => void
    user: any
    error: Error | null
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null)

// Provider component that wraps the app
//isSwitching will be used in future to prevent screen flashes
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { authorize, clearSession, user, error, getCredentials} = useAuth0()
    //set this to false to enable and uncomment user conditional in
    //useEffect below to enable auth
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true)
    const [isLoading, setIsLoading] = useState(true)
    const [isSwitching, setIsSwitching] = useState(false)

    useEffect(() => {
//       if (user) {
//         console.log("User session found:", user.email || user.name)
//         setIsAuthenticated(true)
//       } else {
//         console.log("No user session")
//         setIsAuthenticated(false)
//       }
      setIsLoading(false)
    }, [user])

    const signIn = async () => {
        try {
          await authorize()
          const credentials = await getCredentials()
          console.log("Auth credentials obtained")
        } catch (e) {
          console.error("Login error:", e)
        }
    }

    const signOut = async () => {
        try {
          await clearSession()
        } catch (e) {
          console.error("Logout error:", e)
        }
    }

    return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        isAuthenticated,
        isLoading: isLoading,
        isSwitching: isSwitching,
        setIsSwitching,
        user,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
