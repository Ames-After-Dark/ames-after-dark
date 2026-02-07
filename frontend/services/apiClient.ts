import Constants from "expo-constants";
import { Platform } from "react-native";

const { manifest } = Constants;

// Determine base URL based on platform
const BASE_URL = (() => {

  const publicAPI = "https://api.amesafterdark.com/";

  if (Platform.OS === "web") {
      return publicAPI;
  } else if (Platform.OS === "android") {
    // Android emulator routes host machine via 10.0.2.2
      return publicAPI;
  } else {
    // iOS simulator or physical device
      return publicAPI;
  }
})();

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}
