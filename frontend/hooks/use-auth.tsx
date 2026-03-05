import { createContext, useContext, useEffect, useState } from "react"
import { useAuth0 } from "react-native-auth0"
import { useRouter, useSegments, useRootNavigationState } from "expo-router"
import { checkUserStatus, UserStatus, getUsernameByAuth } from "@/services/userService"
import { config } from "@/auth0.config"

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
    userStatus: UserStatus | null
    username: string | null
    refreshUserStatus: () => Promise<void>
    refreshUsername: () => Promise<void>
    getAccessToken: () => Promise<string | null>
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null)

// Provider component that wraps the app
//isSwitching will be used in future to prevent screen flashes
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { authorize, clearSession, user, error, getCredentials} = useAuth0()
    //set this to false to enable and uncomment user conditional in
    //useEffect below to enable auth
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSwitching, setIsSwitching] = useState(false)
    const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
    const [username, setUsername] = useState<string | null>(null)

    useEffect(() => {
      if (user) {
        console.log("User session found:", user.email || user.name)
        setIsAuthenticated(true)
        // Check user status when user is found
        refreshUserStatus()
        // Fetch username
        fetchUsername()
      } else {
        console.log("No user session")
        setIsAuthenticated(false)
        setUserStatus(null)
        setUsername(null)
      }
      setIsLoading(false)
    }, [user])

    const fetchUsername = async () => {
      const credentials = await getCredentials()
      if (credentials?.accessToken) {
        const response = await getUsernameByAuth(credentials.accessToken)
        // Response will contain { username: string | null }
        setUsername(response.username)
      }
    }

    const refreshUserStatus = async () => {
      try {
        const credentials = await getCredentials()
        if (credentials?.accessToken) {
          const status = await checkUserStatus(credentials.accessToken)
          setUserStatus(status)
          console.log("User status:", status)
        }
      } catch (e) {
        console.error("Error fetching user status:", e)
      }
    }

    const signIn = async () => {
        try {
          await authorize({ audience: config.audience })
          const credentials = await getCredentials()
          console.log("Auth credentials obtained:", credentials ? "YES" : "NO")
          if (credentials?.accessToken) {
            console.log("Access token length:", credentials.accessToken.length)
          }
          
          // Check user registration status
          if (credentials?.accessToken) {
            await refreshUserStatus()
            await fetchUsername()
          }
        } catch (e) {
          console.error("Login error:", e)
        }
    }

    const signOut = async () => {
        try {
          await clearSession()
          setUsername(null)
        } catch (e) {
          console.error("Logout error:", e)
        }
    }

    const getAccessToken = async (): Promise<string | null> => {
        try {
          const credentials = await getCredentials()
          return credentials?.accessToken || null
        } catch (e) {
          console.error("Error getting access token:", e)
          return null
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
        userStatus,
        username,
        refreshUserStatus,
        refreshUsername: fetchUsername,
        getAccessToken,
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
