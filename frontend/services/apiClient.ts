import Constants from "expo-constants";
import { Platform } from "react-native";

// const { manifest } = Constants;

// Determine base URL based on platform
// const BASE_URL = (() => {

//   const publicAPI = "https://api.amesafterdark.com/api";

//   if (Platform.OS === "web") {
//       return publicAPI;
//   } else if (Platform.OS === "android") {
//     // Android emulator routes host machine via 10.0.2.2
//       return publicAPI;
//   } else {
//     // iOS simulator or physical device
//       return publicAPI;
//   }
// })();

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`[apiFetch] Requesting: ${options.method || 'GET'} ${url}`);
  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[apiFetch] Error ${response.status}: ${errorText}`);
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    if (response.status === 204) {
      return null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error: any) {
    console.error(`[apiFetch] Request failed for URL: ${url}`);
    console.error(`[apiFetch] Error name: ${error?.name}, message: ${error?.message}`);
    if (error?.cause) {
      console.error(`[apiFetch] Error cause: ${error.cause}`);
    }
    throw error;
  }
}