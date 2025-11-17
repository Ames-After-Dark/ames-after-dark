import { createContext, useContext, useEffect, useState } from "react"
import { useAuth0 } from "react-native-auth0"
import * as Linking from 'expo-linking'
import { config } from '@/auth0.config'

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
  needsDataCollection: boolean
  dataCollectionParams: { userId?: string; email?: string; state?: string } | null
  completeDataCollection: (birthday: string, phoneNumber: string) => Promise<void>
}

// // Create the context with a default value
// const AuthContext = createContext<AuthContextType | null>(null)

// Provider component that wraps the app
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { authorize, clearSession, user, error, getCredentials } = useAuth0()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSwitching, setIsSwitching] = useState(false)
  const [needsDataCollection, setNeedsDataCollection] = useState(false)
  const [dataCollectionParams, setDataCollectionParams] = useState<{
    userId?: string
    email?: string
    state?: string
  } | null>(null)

  // Handle deep links from Auth0 redirect for data collection
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url
      const { path, queryParams } = Linking.parse(url)

      console.log("Deep link received:", path, queryParams)

      // Check if this is the data collection redirect
      if (path === 'collect-user-info') {
        setNeedsDataCollection(true)
        setDataCollectionParams({
          userId: queryParams?.user_id as string,
          email: queryParams?.email as string,
          state: queryParams?.state as string,
        })
      }
    }

    const subscription = Linking.addEventListener('url', handleDeepLink)

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url })
      }
    })

    return () => subscription.remove()
  }, [])

  useEffect(() => {
    //Uncomment when ready to enable auth
    if (user) {
      console.log("User session found:", user.email || user.name)
      setIsAuthenticated(true)
    } else {
      console.log("No user session")
      setIsAuthenticated(false)
    }
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
      setNeedsDataCollection(false)
      setDataCollectionParams(null)
    } catch (e) {
      console.error("Logout error:", e)
    }
  }

  //Flow is: auth0 redirects to collection page on signup
  //Frontend page will grab birthday and phone #
  //Frontend will call this function - which will call the backend
  //This call is authenticated with auth0 token
  //This call will create a user in the db through the backend controller
  //Afterwards we will hit the /continue endpoint through auth0
  const completeDataCollection = async (birthday: string, phoneNumber: string) => {
    if (!dataCollectionParams?.state) {
      throw new Error("Missing state parameter for data collection");
    }

    if (!user) {
      throw new Error("No user found");
    }

    const AUTH0_DOMAIN = config.domain;
    const BACKEND_URL = { publicAPI } / createUser;

    try {
      // Call backend to create user
      //Add authorization to header
      const backendRes = await fetch(`${publicAPI}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth0Id: user.sub,
          email: user.email,
          phoneNumber,
          birthday,
        }),
      });

      if (!backendRes.ok) {
        const errData = await backendRes.json();
        throw new Error(errData.message || 'Failed to create user in database');
      }

      console.log("User created in database successfully");

      // Redirect to Auth0's /continue to resume login
      // This is a GET redirect, not a POST
      const continueUrl = `https://${AUTH0_DOMAIN}/continue?state=${dataCollectionParams.state}`;

      // Use Linking to open the URL (this triggers onContinuePostLogin)
      await Linking.openURL(continueUrl);

      // Cleanup local state
      setNeedsDataCollection(false);
      setDataCollectionParams(null);

    } catch (err) {
      console.error("Data collection error:", err);
      throw err;
    }
  };
};

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
      needsDataCollection,
      dataCollectionParams,
      completeDataCollection,
    }}
  >
    {children}
  </AuthContext.Provider>
)


export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
