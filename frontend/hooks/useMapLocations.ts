import { useState, useEffect } from 'react';
import { fetchLocations, type Location } from '@/services/locationService';

interface UseMapLocationsReturn {
    locations: Location[];
    isLoading: boolean;
    error: string | null;
}

export const useMapLocations = (): UseMapLocationsReturn => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadLocations = async (showLoadingState = true) => {
            try {
                if (showLoadingState) {
                    setIsLoading(true);
                }
                const data = await fetchLocations();
                setLocations(data);
                setError(null);
            }
            catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                }
                else {
                    setError('An unexpected error occurred.');
                }
            }
            finally {
                if (showLoadingState) {
                    setIsLoading(false);
                }
            }
        };

        loadLocations(true);

        // Keep map open/closed status fresh for friend marker visibility.
        const interval = setInterval(() => {
            loadLocations(false);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    return { locations, isLoading, error };
};