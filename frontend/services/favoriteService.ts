import { apiFetch } from "./apiClient";

export interface FavoriteRecord {
    location_id: number;
    favorited_at: string;
}

export const favoriteService = {

    getUserFavorites: async (userId: number): Promise<FavoriteRecord[]> => {
        const responseData = await apiFetch(`/userfavorites/${userId}`);
        console.log("Fetched favorites for user", userId, responseData);
        return responseData;
    },

    toggleFavorite: async (userId: number, locationId: number): Promise<{ favorited: boolean }> => {
        const result = await apiFetch(`/userfavorites/toggle`, {
            method: 'POST',
            body: JSON.stringify({ userId, locationId }),
        });
        return result;
    }
};