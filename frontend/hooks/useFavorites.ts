import { useState, useCallback } from 'react';
import { favoriteService } from '@/services/favoriteService';
import { useAuth } from './use-auth';

export function useFavorites() {

    const { currentUser } = useAuth();
    const USER_ID = currentUser?.id ? Number(currentUser.id) : null;

    const [favorites, setFavorites] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);

    const loadFavorites = useCallback(async () => {
        if (!USER_ID || isNaN(USER_ID)) {
            console.log("Skipping favorites fetch: USER_ID is not a valid number.");
            return;
        }

        setLoading(true);
        try {
            // We pass the numeric USER_ID here
            const data = await favoriteService.getUserFavorites(USER_ID);

            const favMap: Record<string, boolean> = {};
            if (data && Array.isArray(data)) {
                data.forEach(f => {
                    // Map location_id as a string key for the local state object
                    favMap[String(f.location_id)] = true;
                });
            }
            setFavorites(favMap);
        } catch (error) {
            console.error("Failed to load favorites", error);
        } finally {
            setLoading(false);
        }
    }, [USER_ID]);

    const toggleFavorite = useCallback(async (locationId: number | string) => {
        if (!USER_ID || isNaN(USER_ID)) {
            console.log("Skipping favorite toggle: USER_ID is not a valid number.");
            return;
        }

        const idStr = String(locationId);
        // Ensure locationId is also sent as a number
        const idNum = Number(locationId);

        setFavorites(prev => ({ ...prev, [idStr]: !prev[idStr] }));

        try {
            // Send both as numbers to the service
            const result = await favoriteService.toggleFavorite(USER_ID, idNum);
            setFavorites(prev => ({ ...prev, [idStr]: result.favorited }));
        } catch (error) {
            setFavorites(prev => ({ ...prev, [idStr]: !prev[idStr] }));
        }
    }, [USER_ID]);

    const isFavorited = (locationId: number | string) => !!favorites[String(locationId)];

    return { favorites, toggleFavorite, isFavorited, loadFavorites, loading };
}