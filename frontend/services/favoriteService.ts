import { apiFetch } from "./apiClient";

export interface FavoriteRecord {
    location_id: number;
    favorited_at: string;
}

export const favoriteService = {

    getUserFavorites: async (token: string): Promise<FavoriteRecord[]> => {
        const responseData = await apiFetch(`/userfavorites`, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });
        console.log("Fetched favorites", responseData);
        return responseData;
    },

    toggleFavorite: async (locationId: number, token: string): Promise<{ favorited: boolean }> => {
        const result = await apiFetch(`/userfavorites/toggle`, {
            method: 'POST',
            body: JSON.stringify({ locationId }),
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });
        return result;
    }
};