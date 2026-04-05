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
    updateLocation: async (data: UserLocationData, token: string) => {
        return await apiFetch(`/userlocations`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });
    },

    setGhostMode: async (hours: number, token: string): Promise<GhostModeResponse> => {
        return await apiFetch(`/userlocations/ghost`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ hours }),
        });
    },
};

export const FriendLocationService = {
    getFriendsLocations: async (token: string) => {

        return await apiFetch(`/userlocations/friends/locations`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    }
};