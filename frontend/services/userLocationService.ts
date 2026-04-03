import { apiFetch } from "./apiClient";

export interface UserLocationData {
    latitude: number;
    longitude: number;
}

export interface GhostModeResponse {
    success: boolean;
    ghost_mode_expires_at: string | null;
    message: string;
}

export const UserLocationService = {
    /**
     * Updates the current user's location in the database
     */
    updateLocation: async (userId: number, data: UserLocationData) => {
        return await apiFetch(`/userlocations/${userId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    setGhostMode: async (userId: number, hours: number): Promise<GhostModeResponse> => {
        return await apiFetch(`/userlocations/${userId}/ghost`, {
            method: "POST",
            body: JSON.stringify({ hours }),
        });
    },
};

export const FriendLocationService = {
    getFriendsLocations: async (userId: number) => {

        return await apiFetch(`/userlocations/${userId}/friends/locations`);
    }
};