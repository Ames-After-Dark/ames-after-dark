import { useState, useCallback, useEffect } from 'react';
import { favoriteService } from '@/services/favoriteService';
import { useAuth } from './use-auth';

export function useFavorites() {

    const { currentUser, getAccessToken, isAuthenticated } = useAuth();
    const USER_ID = currentUser?.id ? Number(currentUser.id) : null;
    const hasValidUserId = USER_ID !== null && !isNaN(USER_ID);

    const [favorites, setFavorites] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!hasValidUserId) {
            setFavorites({});
        }
    }, [hasValidUserId]);

    const loadFavorites = useCallback(async () => {
        if (!hasValidUserId) {
            console.log("Skipping favorites fetch: USER_ID is not a valid number.");
            setFavorites({});
            return;
        }

        setLoading(true);
        try {

            const token = await getAccessToken();
            if (!token) return;

            const data = await favoriteService.getUserFavorites(token, USER_ID!);

            const favMap: Record<string, boolean> = {};
            if (data && Array.isArray(data)) {
                data.forEach(f => {
                    favMap[String(f.location_id)] = true;
                });
                console.log("Successfully mapped favorites:", favMap);
            }
            setFavorites(favMap);
        } catch (error) {
            console.error("Failed to load favorites", error);
        } finally {
            setLoading(false);
        }
    }, [getAccessToken, hasValidUserId]);

    const toggleFavorite = useCallback(async (locationId: number | string) => {
        if (!hasValidUserId) {
            console.log("Skipping favorite toggle: USER_ID is not a valid number.");
            return;
        }

        const idStr = String(locationId);
        const idNum = Number(locationId);

        setFavorites(prev => ({ ...prev, [idStr]: !prev[idStr] }));

        try {
            const token = await getAccessToken();
            if (!token) {
                setFavorites((prev: Record<string, boolean>) => ({ ...prev, [idStr]: !prev[idStr] }));
                return;
            }

            const result = await favoriteService.toggleFavorite(token, idNum);
            setFavorites(prev => ({ ...prev, [idStr]: result.favorited }));
        } catch (error) {
            setFavorites((prev: Record<string, boolean>) => ({ ...prev, [idStr]: !prev[idStr] }));
        }
    }, [getAccessToken, hasValidUserId]);

    const isFavorited = (locationId: number | string) => !!favorites[String(locationId)];

    return {
        favorites,
        toggleFavorite,
        isFavorited,
        loadFavorites,
        loading,
        canUseFavorites: isAuthenticated && hasValidUserId,
    };
}
