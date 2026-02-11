import { apiFetch } from "./apiClient";

export async function getBars() {
  return apiFetch("/locations");
}

