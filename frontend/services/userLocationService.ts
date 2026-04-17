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

export type LocationSharingPreference = 'PUBLIC' | 'PRIVATE' | 'SELECTIVE';

export interface SharingPreferenceResponse {
    success: boolean;
    preference: LocationSharingPreference;
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

    updateSharingPreference: async (token: string, preference: LocationSharingPreference): Promise<SharingPreferenceResponse> => {
        return await apiFetchAuth(`/userlocations/me/preference`, token, {
            method: "PATCH",
            body: JSON.stringify({ preference }),
        });
    },

    setViewerPermission: async (token: string, viewerId: number, enabled: boolean) => {
        return await apiFetchAuth(`/userlocations/permissions/${viewerId}`, token, {
            method: "POST",
            body: JSON.stringify({ enabled }),
        });
    },
};

export const FriendLocationService = {
    getFriendsLocations: async (token: string) => {
        return await apiFetchAuth(`/userlocations/me/friends/locations`, token);
    }
};