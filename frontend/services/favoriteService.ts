import { apiFetch } from "./apiClient";

export interface FavoriteRecord {
    location_id: number;
    favorited_at: string;
}

// services/favoriteService.ts

export const favoriteService = {
    // Corrected: Fetch the response directly
    getUserFavorites: async (userId: number): Promise<FavoriteRecord[]> => {
        const responseData = await apiFetch(`/userfavorites/${userId}`);

        // This log will now show the actual array [ { location_id: 2, ... } ]
        console.log("Fetched favorites for user", userId, responseData);

        return responseData;
    },

    toggleFavorite: async (userId: number, locationId: number): Promise<{ favorited: boolean }> => {
        // Corrected: No destructuring here either
        const result = await apiFetch(`/userfavorites/toggle`, {
            method: 'POST',
            body: JSON.stringify({ userId, locationId }),
        });
        return result;
    }
};