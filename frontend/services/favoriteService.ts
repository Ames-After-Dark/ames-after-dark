import { apiFetchAuth } from "./apiClient";

export interface FavoriteRecord {
    location_id: number;
    favorited_at: string;
}

export const favoriteService = {

    getUserFavorites: async (token: string, userId: number): Promise<FavoriteRecord[]> => {
        const responseData = await apiFetchAuth(`/userfavorites/${userId}`, token);
        console.log("Fetched favorites for current user", responseData);
        return responseData;
    },

    toggleFavorite: async (token: string, locationId: number): Promise<{ favorited: boolean }> => {
        const result = await apiFetchAuth(`/userfavorites/toggle`, token, {
            method: 'POST',
            body: JSON.stringify({ locationId }),
        });
        return result;
    }
};
