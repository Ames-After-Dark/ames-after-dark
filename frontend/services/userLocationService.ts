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

export type LocationSharingPreference = 'PUBLIC' | 'PRIVATE' | 'SELECTIVE';

export interface SharingPreferenceResponse {
    success: boolean;
    preference: LocationSharingPreference;
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

    updateSharingPreference: async (userId: number, preference: LocationSharingPreference): Promise<SharingPreferenceResponse> => {
        return await apiFetch(`/userlocations/${userId}/preference`, {
            method: "PATCH",
            body: JSON.stringify({ preference }),
        });
    },

    setViewerPermission: async (viewerId: number, ownerId: number, enabled: boolean) => {
        return await apiFetch(`/userlocations/permissions/${viewerId}`, {
            method: "POST",
            body: JSON.stringify({ ownerId, enabled }),
        });
    },
};

export const FriendLocationService = {
    getFriendsLocations: async (userId: number) => {

        return await apiFetch(`/userlocations/${userId}/friends/locations`);
    }
};