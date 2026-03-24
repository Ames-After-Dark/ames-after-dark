import React, { createContext, useContext, useEffect } from 'react';
import { useFavorites as useBaseFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/use-auth';

const FavoritesContext = createContext<ReturnType<typeof useBaseFavorites> | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const favoritesLogic = useBaseFavorites();
    const { currentUser } = useAuth();

    // Directly extract the ID to watch it
    const userId = currentUser?.id;

    useEffect(() => {
        // Only fetch if we have a valid numeric ID
        if (userId && typeof userId === 'number') {
            console.log("Auth synced. Triggering favorites load for ID:", userId);
            favoritesLogic.loadFavorites();
        }
    }, [userId]); // This ensures that as soon as 21 appears, we fetch.

    return (
        <FavoritesContext.Provider value={favoritesLogic}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (!context) throw new Error("useFavorites must be used within a FavoritesProvider");
    return context;
}