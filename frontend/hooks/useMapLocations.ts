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
        let isActive = true;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const loadLocations = async (showLoadingState = true) => {
            try {
                if (showLoadingState) {
                    setIsLoading(true);
                }
                const data = await fetchLocations();
                if (!isActive) {
                    return;
                }
                setLocations(data);
                setError(null);
            }
            catch (err: unknown) {
                if (!isActive) {
                    return;
                }
                if (err instanceof Error) {
                    setError(err.message);
                }
                else {
                    setError('An unexpected error occurred.');
                }
            }
            finally {
                if (!isActive) {
                    return;
                }
                if (showLoadingState) {
                    setIsLoading(false);
                }
            }
        };

        const scheduleRefresh = () => {
            timeoutId = setTimeout(async () => {
                await loadLocations(false);

                if (isActive) {
                    scheduleRefresh();
                }
            }, 1800000); // 30 minutes in milliseconds
        };

        void loadLocations(true).then(() => {
            if (isActive) {
                scheduleRefresh();
            }
        });

        return () => {
            isActive = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, []);

    return { locations, isLoading, error };
};