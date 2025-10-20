import Constants from "expo-constants";
import { Platform } from "react-native";

const { manifest } = Constants;

// Determine base URL based on platform
const BASE_URL = (() => {
  if (Platform.OS === "web") {
    return "http://localhost:3000/api";
  } else if (Platform.OS === "android") {
    // Android emulator routes host machine via 10.0.2.2
    return "http://10.0.2.2:3000/api";
  } else {
    // iOS simulator or physical device
    const host = manifest?.debuggerHost?.split(":")[0];
    return host ? `http://${host}:3000/api` : "http://localhost:3000/api";
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
