import { apiFetch, apiFetchAuth } from "./apiClient";

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
    updateLocation: async (token: string, data: UserLocationData) => {
        return await apiFetchAuth(`/userlocations/me`, token, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    setGhostMode: async (token: string, hours: number): Promise<GhostModeResponse> => {
        return await apiFetchAuth(`/userlocations/me/ghost`, token, {
            method: "POST",
            body: JSON.stringify({ hours }),
        });
    },
};

export const FriendLocationService = {
    getFriendsLocations: async (token: string) => {
        return await apiFetchAuth(`/userlocations/me/friends/locations`, token);
    }
};