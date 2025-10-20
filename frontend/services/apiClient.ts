// services/apiClient.ts
import Constants from "expo-constants";

const { manifest } = Constants;
const host = manifest?.debuggerHost?.split(":").shift();
export const BASE_URL = host ? `http://${host}:3000/api` : "http://localhost:3000/api";

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
