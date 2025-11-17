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
        const loadLocations = async () => {
            try {
                setIsLoading(true);
                const data = await fetchLocations();
                setLocations(data);
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
                setIsLoading(false);
            }
        };

        loadLocations();
    }, []);

    return { locations, isLoading, error };
};