import { apiFetch } from "./apiClient";

export interface UserLocationData {
    latitude: number;
    longitude: number;
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
    }
};

export const FriendLocationService = {
    getFriendsLocations: async (userId: number) => {

        return await apiFetch(`/userlocations/${userId}/friends/locations`);
    }
};