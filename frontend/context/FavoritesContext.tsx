import React, { createContext, useContext, useEffect } from 'react';
import { useFavorites as useBaseFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/hooks/use-auth';

const FavoritesContext = createContext<ReturnType<typeof useBaseFavorites> | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {

    const favoritesLogic = useBaseFavorites();

    const { currentUser } = useAuth();
    const userId = currentUser?.id;
    const numericUserId = userId ? Number(userId) : null;

    useEffect(() => {

        if (numericUserId && !Number.isNaN(numericUserId)) {
            console.log("Auth synced. Triggering favorites load for ID:", numericUserId);
            favoritesLogic.loadFavorites();
        }
    }, [numericUserId, favoritesLogic.loadFavorites]);

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
